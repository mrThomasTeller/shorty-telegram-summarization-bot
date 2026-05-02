import _ from 'lodash';
import {
  concat,
  concatMap,
  from,
  map,
  of,
  pipe,
  startWith,
  tap,
  type Observable,
  type UnaryFunction,
} from 'rxjs';
import { sendMessageToGptWithRetries$ } from '../../../../api/gpt';
import { getEnv } from '../../../../config/envVars';
import logger from '../../../../config/logger';
import { t } from '../../../../config/translations/index';
import { getFormattedMessage } from '../../../../data/dbChatMessageUtils';
import { getPartsAndPointsCountForText } from '../../../../data/summaryUtils';
import type DbChatMessage from '../../../../data/types/DbChatMessage';
import { endWithAfter, insertBefore } from '../../../../lib/common/rxOperators';
import { reEnumerateText } from '../../../../lib/common/text';
import type Services from '../../../../services/Services';
import { type ChatMessagesForSummaryData } from '../types/ChatMessagesForSummaryData';
import { type SummarizeResultCase } from '../types/SummarizeResultCase';

const queryGptOrReturnError$ = _.curry(
  (
    services: Services,
    chatId: number,
    data: ChatMessagesForSummaryData
  ): Observable<SummarizeResultCase> => {
    if (data.messages.length === 0) {
      return of({ type: 'noMessages' });
    }

    const minMessagesCount = getEnv().MIN_MESSAGES_COUNT_TO_SUMMARIZE;
    if (data.allMessagesCount < minMessagesCount) {
      return of({ type: 'fewMessages' });
    }

    return of(data.messages).pipe(
      map(formatChatMessages),
      tap((formattedText) => {
        logQueryStage('formatted_messages', chatId, {
          formattedLength: formattedText.length,
          messagesCount: data.messages.length,
          allMessagesCount: data.allMessagesCount,
        });
      }),
      map(getPartsAndPointsCountForText),
      tap((parts) => {
        logQueryStage('parts_created', chatId, {
          partsCount: parts.length,
          totalPartLength: parts.reduce((sum, part) => sum + part.text.length, 0),
        });
      }),
      concatMap(rejectOverflowedSummaryPartsAndMakeSummary$(services, chatId, data.maxSummaryParts)),
      insertSummaryLayout(chatId, data)
    );
  }
);

export default queryGptOrReturnError$;

const formatChatMessages = (messages: DbChatMessage[]): string =>
  messages.map((msg) => getFormattedMessage(msg)).join('\n');

const rejectOverflowedSummaryPartsAndMakeSummary$ = _.curry(
  (
    services: Services,
    chatId: number,
    maxSummaryParts: number,
    parts: { text: string; pointsCount: number }[]
  ) => {
    const allowedParts = _.takeRight(parts, maxSummaryParts);
    const gptQueryParts = mapSummaryPartsToGptQuery(allowedParts);

    logQueryStage('gpt_parts_selected', chatId, {
      originalPartsCount: parts.length,
      allowedPartsCount: allowedParts.length,
      totalPromptLength: gptQueryParts.reduce((sum, part) => sum + part.text.length, 0),
    });

    return concat<SummarizeResultCase[]>(
      parts.length > maxSummaryParts
        ? of({ type: 'tooManySummaryParts', count: parts.length })
        : [],
      from(gptQueryParts).pipe(
        concatMap(querySummaryPartFromGptAndReEnumerateResponse$(services, chatId))
      )
    );
  }
);

const querySummaryPartFromGptAndReEnumerateResponse$ = _.curry(
  (services: Services, chatId: number, { text, pointsCount, index }: GptQueryPart) => {
    logQueryStage('gpt_request', chatId, {
      index,
      pointsCount,
      promptLength: text.length,
    });

    return sendMessageToGptWithRetries$({ gpt: services.gpt, text }).pipe(
      tap((gptResultCase) => {
        logQueryStage('gpt_response', chatId, {
          index,
          pointsCount,
          resultType: gptResultCase.type,
          responseLength: gptResultCase.type === 'responseFromGPT' ? gptResultCase.text.length : 0,
        });
      }),
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
  }
);

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

function logQueryStage(chatId: number, stage: string, details: Record<string, string | number>): void {
  const memory = process.memoryUsage();
  const detailsText = Object.entries(details)
    .map(([key, value]) => `${key}=${value}`)
    .join(' ');

  logger.info(
    `[summarize-memory] stage=${stage} chatId=${chatId} ${detailsText} rss=${memory.rss} heapUsed=${memory.heapUsed} heapTotal=${memory.heapTotal} external=${memory.external} arrayBuffers=${memory.arrayBuffers}`
  );
}

const insertSummaryLayout = (
  chatId: number,
  { freeSummariesRest, premiumSummariesRest, subscription, usedPremium }: ChatMessagesForSummaryData
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
      { type: 'summaryHeader', usedPremium, userPremium: subscription?.userId != null },
      (c) => c.type === 'responseFromGPT'
    ),
    endWithAfter<SummarizeResultCase>(
      (c) => c.type === 'responseFromGPT',
      {
        type: 'endSummary',
        subscription,
        freeSummariesRest,
        premiumSummariesRest,
      },
      showAdsCase
    )
  );
};
