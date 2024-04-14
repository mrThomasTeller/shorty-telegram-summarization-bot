import { type Observable, concatMap, mergeMap, of, exhaustMap, last } from 'rxjs';
import type ChatController from '../../ChatController.ts';
import type Services from '../../../services/Services.ts';
import _ from 'lodash';
import type TelegramBot from 'node-telegram-bot-api';
import printNews from '../../../useCases/printNews.ts';
import { getChatMessagesForSummary } from './stages/getChatMessagesForSummary.ts';
import queryGptOrReturnError$ from './stages/queryGptOrReturnError$.ts';
import handleSummarizeResultCase from './stages/handleSummarizeResultCase.ts';
import { matchEither } from '../../../lib/fp.ts';
import { getLimitsData } from './stages/getLimitsData.ts';

const summarizeCommandController: ChatController = ({ chat$, chatId, services }) => {
  chat$.pipe(exhaustMap(handleSingleSummarizeRequest$(chatId, services))).subscribe(_.noop);
};

export default summarizeCommandController;

const handleSingleSummarizeRequest$ = _.curry(
  (chatId: number, services: Services, msg: TelegramBot.Message): Observable<void> =>
    of(msg).pipe(
      mergeMap(getLimitsData(services)),
      mergeMap(getChatMessagesForSummary(services, msg)),
      mergeMap((data) => matchEither(of, queryGptOrReturnError$(services, chatId), data)),
      concatMap(handleSummarizeResultCase(services, msg)),

      last(),
      mergeMap(() => printNews(services.db, services.telegramBot, chatId))
    )
);
