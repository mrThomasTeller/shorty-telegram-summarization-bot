import _ from 'lodash';
import type TelegramBot from 'node-telegram-bot-api';
import { concatMap, exhaustMap, last, mergeMap, of, type Observable } from 'rxjs';
import { matchEither } from '../../../lib/common/fp';
import { catchAndLogError } from '../../../lib/common/rxOperators';
import type Services from '../../../services/Services';
import printNews from '../../../useCases/printNews';
import type ChatController from '../../ChatController';
import { getChatMessagesForSummary } from './stages/getChatMessagesForSummary';
import { getLimitsData } from '../../../data/subscriptionLimits';
import handleSummarizeResultCase from './stages/handleSummarizeResultCase';
import queryGptOrReturnError$ from './stages/queryGptOrReturnError$';

const summarizeCommandController: ChatController = ({ chat$, chatId, services }) => {
  chat$.pipe(exhaustMap(handleSingleSummarizeRequest$(chatId, services))).subscribe(_.noop);
};

export default summarizeCommandController;

const handleSingleSummarizeRequest$ = _.curry(
  (chatId: number, services: Services, msg: TelegramBot.Message): Observable<void> =>
    of(msg).pipe(
      mergeMap((msg) =>
        getLimitsData({ db: services.db, userId: msg.from?.id, chatId: msg.chat.id })
      ),
      mergeMap(getChatMessagesForSummary(services, msg)),
      mergeMap((data) => matchEither(of, queryGptOrReturnError$(services, chatId), data)),
      concatMap(handleSummarizeResultCase(services, msg)),

      last(),
      mergeMap(() => printNews(services.db, services.telegramBot, msg.chat)),
      // todo ошибки нужно ловить на глобальном уровне для каждого сообщения
      catchAndLogError('Error in summarizeCommandController')
    )
);
