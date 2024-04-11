/* eslint-disable max-lines */
import { type GptResultCase, sendMessageToGptWithRetries$ } from '../../api/gpt.ts';
import { reEnumerateText } from '../../lib/text.ts';
import { getFormattedMessage } from '../../data/dbChatMessageUtils.ts';
import { yesterday, thisWeekStart } from '../../lib/date.ts';
import {
  type Observable,
  type UnaryFunction,
  concatMap,
  map,
  mergeMap,
  of,
  pipe,
  startWith,
  exhaustMap,
  concat,
  from,
  last,
} from 'rxjs';
import type ChatController from '../ChatController.ts';
import { t } from '../../config/translations/index.ts';
import { endWithAfter, insertBefore } from '../../lib/rxOperators.ts';
import type Services from '../../services/Services.ts';
import logger, { type LogLevel } from '../../config/logger.ts';
import _ from 'lodash';
import type DbChatMessage from '../../data/DbChatMessage.ts';
import { getEnv } from '../../config/envVars.ts';
import { max as maxTime } from 'date-fns';
import type TelegramBot from 'node-telegram-bot-api';
import { formatSummaryFromGpt, getPartsAndPointsCountForText } from '../../data/summaryUtils.ts';
import { setTimeout } from 'node:timers/promises';
import printNews from '../../useCases/printNews.ts';
import { type Tariff } from '@prisma/client';

type SummarizeResultCase =
  | GptResultCase
  | { type: 'noMessages' }
  | { type: 'fewMessages' }
  | { type: 'tooManySummaryParts'; count: number }
  | { type: 'tooManySummaries' }
  | { type: 'startSummary' }
  | { type: 'summaryHeader'; usedPremium: boolean }
  | { type: 'endSummary'; summariesRest: number; premium: boolean }
  | { type: 'ads' };

// todo этот файл пора рефакторить
const summarizeCommandController: ChatController = ({ chat$, chatId, services }) => {
  chat$.pipe(exhaustMap(handleSingleSummarizeRequest$(chatId, services))).subscribe(_.noop);
};

export default summarizeCommandController;

const handleSingleSummarizeRequest$ = _.curry(
  (chatId: number, services: Services, msg: TelegramBot.Message): Observable<void> =>
    of(msg).pipe(
      mergeMap(getChatMessagesForSummary(services, chatId)),
      mergeMap(queryGptOrReturnError$(services, chatId)),
      concatMap(handleSummaryResultCase(services, chatId)),
      last(),
      mergeMap(() => printNews(services.db, services.telegramBot, chatId))
    )
);

const queryGptOrReturnError$ =
  (services: Services, chatId: number) =>
  (messages: SummarizeResultCase | ChatMessagesForSummaryData): Observable<SummarizeResultCase> => {
    if (!('messages' in messages)) return of(messages);

    const minMessagesCount = getEnv().MIN_MESSAGES_COUNT_TO_SUMMARIZE;
    if (messages.messages.length === 0) {
      return of({ type: 'noMessages' });
    } else if (messages.messages.length < minMessagesCount) {
      return of({ type: 'fewMessages' });
    } else {
      return of(messages.messages).pipe(
        map(formatChatMessages),
        map(getPartsAndPointsCountForText),
        concatMap(rejectOverflowedSummaryPartsAndMakeSummary$(chatId, services)),
        insertSummaryLayout(chatId, messages.summariesRest, messages.usedPremium)
      );
    }
  };

type ChatMessagesForSummaryData = {
  messages: DbChatMessage[];
  summariesRest: number;
  usedPremium: boolean;
};

// todo это большой некрасивый костыль
const chatToTariffMap = new Map<number, Tariff | undefined>();

// todo refactor: make it to return Either<SummarizeResultCase, DbChatMessage[]>
const getChatMessagesForSummary =
  (services: Services, chatId: number) =>
  async (): Promise<SummarizeResultCase | ChatMessagesForSummaryData> => {
    // todo test
    const [summaries, tariff] = await Promise.all([
      services.db.getSummariesFrom(chatId, thisWeekStart()),
      services.db.getChatTariff(chatId),
    ]);
    chatToTariffMap.set(chatId, tariff);

    const freeSummariesRest = getEnv().MAX_SUMMARIES_PER_WEEK - summaries.length;
    const summariesRest = freeSummariesRest + (tariff?.summaries ?? 0);

    if (summariesRest <= 0) {
      return { type: 'tooManySummaries' };
    }

    const lastSummaryDate = summaries.at(-1)?.date ?? yesterday();
    const startSummaryFrom = maxTime([lastSummaryDate, yesterday()]);
    return {
      messages: await services.db.getChatMessages(chatId, startSummaryFrom),
      summariesRest: summariesRest - 1,
      usedPremium: freeSummariesRest <= 0,
    };
  };

const formatChatMessages = (messages: DbChatMessage[]): string =>
  messages.map((msg) => getFormattedMessage(msg)).join('\n');

const rejectOverflowedSummaryPartsAndMakeSummary$ = _.curry(
  (chatId: number, services: Services, parts: { text: string; pointsCount: number }[]) => {
    const tariff = chatToTariffMap.get(chatId);
    const maxSummaryParts = getEnv().MAX_SUMMARY_PARTS * (tariff?.messagesMultiplier ?? 1);

    const allowedParts = _.takeRight(parts, maxSummaryParts);
    const gptQueryParts = mapSummaryPartsToGptQuery(allowedParts);

    return concat<SummarizeResultCase[]>(
      parts.length > maxSummaryParts
        ? of({ type: 'tooManySummaryParts', count: parts.length })
        : [],

      from(gptQueryParts).pipe(concatMap(querySummaryPartFromGptAndReEnumerateResponse$(services)))
    );
  }
);

const querySummaryPartFromGptAndReEnumerateResponse$ = _.curry(
  (services: Services, { text, pointsCount, index }: GptQueryPart) =>
    sendMessageToGptWithRetries$({ gpt: services.gpt, text }).pipe(
      map(
        (gptResultCase): SummarizeResultCase =>
          gptResultCase.type === 'responseFromGPT'
            ? {
                ...gptResultCase,
                text: reEnumerateText(gptResultCase.text.trim(), index * pointsCount + 1),
              }
            : gptResultCase
      )
    )
);

const handleSummaryResultCase =
  (services: Services, chatId: number) => async (resultCase: SummarizeResultCase) => {
    const logArgs = getLogMessageForSummarizeResultCase(resultCase, chatId);
    if (logArgs !== undefined) logger.log(...logArgs);

    if (resultCase.type === 'summaryHeader') {
      await services.db.createSummary(chatId, new Date(), resultCase.usedPremium);
    }

    const text = getBotMessageForSummarizeResultCase(resultCase);

    await services.telegramBot.sendMessage(
      chatId,
      text,
      resultCase.type === 'responseFromGPT'
        ? undefined
        : {
            parse_mode: 'HTML',
          }
    );

    if (resultCase.type === 'ads') {
      await setTimeout(getEnv().TIME_TO_SHOW_ADS);
      await services.ads.showAds(chatId);
    }
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
    case 'startSummary': {
      return ['info', t('summarize.debug.queryInfo', { chatId })];
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
      return formatSummaryFromGpt(resultCase.text);
    }
    case 'endSummary': {
      return t(
        resultCase.premium ? 'summarize.message.end.premium' : 'summarize.message.end.free',
        {
          rest: resultCase.summariesRest,
          total: getEnv().MAX_SUMMARIES_PER_WEEK,
        }
      );
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
    case 'fewMessages': {
      return t('summarize.errors.fewMessages', {
        count: getEnv().MIN_MESSAGES_COUNT_TO_SUMMARIZE,
      });
    }
    case 'noMessages': {
      return t('summarize.errors.noMessages');
    }
    case 'tooManySummaries': {
      return t('summarize.errors.maxSummariesExceeded', {
        count: getEnv().MAX_SUMMARIES_PER_WEEK,
      });
    }
    case 'tooManySummaryParts': {
      return t('summarize.message.tooManyMessages');
    }
    case 'ads': {
      return t('summarize.message.dontShowAds');
    }
  }
}

type GptQueryPart = {
  pointsCount: number;
  index: number;
  text: string;
};

const mapSummaryPartsToGptQuery = (
  parts: { text: string; pointsCount: number }[]
): GptQueryPart[] =>
  parts.map(({ text, pointsCount }, index) => ({
    pointsCount,
    index,
    text: t(pointsCount === 1 ? 'summarize.gptQuery' : 'summarize.gptQueryWithPoints', {
      pointsCount,
      text,
    }),
  }));

// todo make this function more expressive
const insertSummaryLayout = (
  chatId: number,
  summariesRest: number,
  usedPremium: boolean
): UnaryFunction<Observable<SummarizeResultCase>, Observable<SummarizeResultCase>> => {
  const { SHOW_ADS } = getEnv();
  const showAdsCase: SummarizeResultCase | undefined =
    SHOW_ADS === true || (typeof SHOW_ADS === 'number' && SHOW_ADS === chatId)
      ? {
          type: 'ads',
        }
      : undefined;

  return pipe(
    startWith<SummarizeResultCase>({ type: 'startSummary' }),
    insertBefore<SummarizeResultCase>(
      { type: 'summaryHeader', usedPremium },
      (c) => c.type === 'responseFromGPT'
    ),
    endWithAfter<SummarizeResultCase>(
      (c) => c.type === 'responseFromGPT',
      {
        type: 'endSummary',
        summariesRest,
        premium: !!chatToTariffMap.get(chatId),
      },
      showAdsCase
    )
  );
};
