import _ from 'lodash';
import {
  concat,
  concatMap,
  from,
  map,
  of,
  pipe,
  startWith,
  type Observable,
  type UnaryFunction,
} from 'rxjs';
import { sendMessageToGptWithRetries$ } from '../../../../api/gpt';
import { getEnv } from '../../../../config/envVars';
import { t } from '../../../../config/translations/index';
import type DbChatMessage from '../../../../data/types/DbChatMessage';
import { getFormattedMessage } from '../../../../data/dbChatMessageUtils';
import { getPartsAndPointsCountForText } from '../../../../data/summaryUtils';
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
    if (data.messages.length < minMessagesCount) {
      return of({ type: 'fewMessages' });
    }

    return of(data.messages).pipe(
      map(formatChatMessages),
      map(getPartsAndPointsCountForText),
      concatMap(rejectOverflowedSummaryPartsAndMakeSummary$(services, data.maxSummaryParts)),
      insertSummaryLayout(chatId, data)
    );
  }
);

export default queryGptOrReturnError$;

const formatChatMessages = (messages: DbChatMessage[]): string =>
  messages.map((msg) => getFormattedMessage(msg)).join('\n');

const rejectOverflowedSummaryPartsAndMakeSummary$ = _.curry(
  (services: Services, maxSummaryParts: number, parts: { text: string; pointsCount: number }[]) => {
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
