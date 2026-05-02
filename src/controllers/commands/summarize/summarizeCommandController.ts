import _ from 'lodash';
import { concatMap, exhaustMap, finalize, last, mergeMap, of, type Observable } from 'rxjs';
import logger from '../../../config/logger';
import { getLimitsData } from '../../../data/subscriptionLimits';
import { catchError } from '../../../lib/common/async';
import { matchEither } from '../../../lib/common/fp';
import { catchAndLogError } from '../../../lib/common/rxOperators';
import type Services from '../../../services/Services';
import printNews from '../../../useCases/printNews';
import type ChatController from '../../ChatController';
import { sendStartMessage } from '../startCommandController';
import { getChatMessagesForSummary } from './stages/getChatMessagesForSummary';
import handleSummarizeResultCase from './stages/handleSummarizeResultCase';
import queryGptOrReturnError$ from './stages/queryGptOrReturnError$';
import type { TgMessageType } from './types/TgMessageType';

const summarizeCommandController: ChatController = ({ chat$, chatId, services }) => {
  chat$.pipe(exhaustMap(handleSingleSummarizeRequest$(chatId, services))).subscribe(_.noop);
};

export default summarizeCommandController;

export const handleSingleSummarizeRequest$ = _.curry(
  (chatId: number, services: Services, msg: TgMessageType): Observable<void> => {
    if (msg.chat.type === 'private') {
      catchError(sendStartMessage(services.telegramBot, chatId));
      return of(undefined);
    }

    logSummarizeMemory('start', {
      chatId,
      messageId: msg.message_id,
      userId: msg.from?.id,
    });

    return of(msg).pipe(
      mergeMap((msg) =>
        getLimitsData({ db: services.db, userId: msg.from?.id, chatId: msg.chat.id })
      ),
      mergeMap(getChatMessagesForSummary(services, msg)),
      mergeMap((data) => matchEither(of, queryGptOrReturnError$(services, chatId), data)),
      concatMap(handleSummarizeResultCase(services, msg)),
      last(),
      mergeMap(() => printNews(services.db, services.telegramBot, msg.chat)),
      catchAndLogError('Error in summarizeCommandController'),
      finalize(() => {
        logSummarizeMemory('before_gc', { chatId, messageId: msg.message_id, userId: msg.from?.id });
        runFullGc();
        logSummarizeMemory('after_gc', { chatId, messageId: msg.message_id, userId: msg.from?.id });
      })
    );
  }
);

function runFullGc(): void {
  const bunRuntime = globalThis as typeof globalThis & {
    Bun?: {
      gc?: (force?: boolean) => void;
    };
  };

  bunRuntime.Bun?.gc?.(true);
}

function logSummarizeMemory(
  stage: string,
  details: { chatId: number; messageId: number; userId: number | undefined }
): void {
  const memory = process.memoryUsage();
  logger.info(
    `[summarize-memory] stage=${stage} chatId=${details.chatId} messageId=${details.messageId} userId=${details.userId ?? 'unknown'} rss=${memory.rss} heapUsed=${memory.heapUsed} heapTotal=${memory.heapTotal} external=${memory.external} arrayBuffers=${memory.arrayBuffers}`
  );
}
