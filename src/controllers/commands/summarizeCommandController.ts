import { type GptResultCase, sendMessageToGptWithRetries$ } from '../../api/gpt.ts';
import { reEnumerateText, splitText } from '../../lib/text.ts';
import { getFormattedMessage } from '../../data/dbChatMessageUtils.ts';
import { yesterday } from '../../lib/date.ts';
import {
  type Observable,
  type UnaryFunction,
  concatMap,
  endWith,
  map,
  mergeMap,
  of,
  pipe,
  startWith,
  tap,
} from 'rxjs';
import type ChatController from '../ChatController.ts';
import { t } from '../../config/translations/index.ts';
import { insertBefore } from '../../lib/rxOperators.ts';
import type Services from '../../services/Services.ts';
import logger, { type LogLevel } from '../../config/logger.ts';

type SummarizeResultCase =
  | GptResultCase
  | { type: 'startSummary' }
  | { type: 'summaryHeader' }
  | { type: 'endSummary' };

const summarizeCommandController: ChatController = ({ chat$, chatId, services }) => {
  chat$.subscribe((msg) => {
    singleSummarizeRequestController({ chat$: of(msg), chatId, services });
  });
};

export default summarizeCommandController;

const singleSummarizeRequestController: ChatController = ({ chat$, chatId, services }) => {
  chat$
    .pipe(
      tap(() => {
        logger.info(t('summarize.debug.queryInfo', { chatId }));
      }),
      mergeMap(getFormattedChatMessagesFor24Hours(services, chatId)),
      concatMap(splitTextForGptQuery),
      concatMap(querySummaryPartFromGptAndReEnumerateResponse$(services)),
      insertSummaryLayout()
    )
    .subscribe(handleSummaryResultCase(services, chatId));
};

const getFormattedChatMessagesFor24Hours = (services: Services, chatId: number) => async () => {
  const messagesForLastDay = await services.db.getChatMessages(chatId, yesterday());
  return messagesForLastDay.length === 0
    ? undefined
    : messagesForLastDay.map((msg) => getFormattedMessage(msg)).join('\n');
};

const querySummaryPartFromGptAndReEnumerateResponse$ =
  (services: Services) =>
  ({ part, pointsCount, index }: { part: string; pointsCount: number; index: number }) =>
    sendMessageToGptWithRetries$({ gpt: services.gpt, text: part }).pipe(
      map(
        (gptResultCase): SummarizeResultCase =>
          gptResultCase.type === 'responseFromGPT'
            ? {
                ...gptResultCase,
                text: reEnumerateText(gptResultCase.text.trim(), index * pointsCount + 1),
              }
            : gptResultCase
      )
    );

const handleSummaryResultCase =
  (services: Services, chatId: number) => async (resultCase: SummarizeResultCase) => {
    const logArgs = getLogMessageForSummarizeResultCase(resultCase, chatId);
    if (logArgs !== undefined) logger.log(...logArgs);

    await services.telegramBot.sendMessage(chatId, getBotMessageForSummarizeResultCase(resultCase));
  };

function getLogMessageForSummarizeResultCase(
  resultCase: SummarizeResultCase,
  chatId: number
): [level: LogLevel, message: string] | undefined {
  switch (resultCase.type) {
    case 'unknownError': {
      return ['error', resultCase.error.message];
    }
    case 'tooManyRequests': {
      return ['error', `Too many requests to GPT for chat ${chatId}`];
    }
    case 'responseFromGPT': {
      return ['info', `Summarize part result for chat ${chatId} generated`];
    }
    default: {
      return undefined;
    }
  }
}

function getBotMessageForSummarizeResultCase(resultCase: SummarizeResultCase): string {
  switch (resultCase.type) {
    case 'startSummary': {
      return t('summarize.message.start');
    }
    case 'summaryHeader': {
      return t('summarize.message.header');
    }
    case 'responseFromGPT': {
      return resultCase.text;
    }
    case 'endSummary': {
      return t('summarize.message.end');
    }
    case 'maxTriesExceeded': {
      return t('summarize.errors.maxQueriesToGptExceeded');
    }
    case 'tooManyRequests': {
      return t('summarize.errors.tooManyRequestsToGpt');
    }
    case 'unknownError': {
      return t('summarize.errors.queryProcess');
    }
  }
}

function splitTextForGptQuery(
  text: string | undefined
): { pointsCount: number; index: number; part: string }[] {
  if (text === undefined) return [];

  const maxLength = 3400;

  const textParts = splitText(text, maxLength);
  const pointsCount =
    textParts.length === 1 ? 5 : textParts.length === 2 ? 4 : textParts.length === 3 ? 3 : 2;

  return textParts.map((part, index) => ({
    pointsCount,
    index,
    part: t('summarize.gptQuery', { pointsCount, part }),
  }));
}

const insertSummaryLayout = (): UnaryFunction<
  Observable<SummarizeResultCase>,
  Observable<SummarizeResultCase>
> =>
  pipe(
    insertBefore<SummarizeResultCase>(
      { type: 'summaryHeader' },
      (resultCase) => resultCase.type === 'responseFromGPT'
    ),
    startWith<SummarizeResultCase>({ type: 'startSummary' }),
    endWith<SummarizeResultCase>({ type: 'endSummary' })
  );
