import { sendMessageToGptWithRetries$, } from '../../api/gpt.js';
import { reEnumerateText } from '../../lib/text.js';
import { getFormattedMessage } from '../../data/dbChatMessageUtils.js';
import { yesterday } from '../../lib/date.js';
import { concatMap, map, mergeMap, of, pipe, startWith, exhaustMap, concat, from, } from 'rxjs';
import { t } from '../../config/translations/index.js';
import { endWithAfter, insertBefore } from '../../lib/rxOperators.js';
import logger from '../../config/logger.js';
import _ from 'lodash';
import { getEnv } from '../../config/envVars.js';
import { max as maxTime } from 'date-fns';
import { formatSummaryFromGpt, getPartsAndPointsCountForText, } from '../../data/summaryUtils.js';
const summarizeCommandController = ({ chat$, chatId, services, }) => {
    chat$
        .pipe(exhaustMap(handleSingleSummarizeRequest$(chatId, services)))
        .subscribe(_.noop);
};
export default summarizeCommandController;
const handleSingleSummarizeRequest$ = _.curry((chatId, services, msg) => of(msg).pipe(mergeMap(getChatMessagesForSummary(services, chatId)), mergeMap(queryGptOrReturnError$(services)), 
// I moved it from subscribe to pipe, because there is a problem with telegram messages when
// one sends them without delay. We need to wait for the previous message to be sent.
// todo move it to subscribe and make Facade for TelegramBotService, which queue messages
concatMap(handleSummaryResultCase(services, chatId))));
const queryGptOrReturnError$ = (services) => (messages) => {
    if (!Array.isArray(messages))
        return of(messages);
    const minMessagesCount = getEnv().MIN_MESSAGES_COUNT_TO_SUMMARIZE;
    if (messages.length === 0) {
        return of({ type: 'noMessages' });
    }
    else if (messages.length < minMessagesCount) {
        return of({ type: 'fewMessages' });
    }
    else {
        return of(messages).pipe(map(formatChatMessages), map(getPartsAndPointsCountForText), concatMap(rejectOverflowedSummaryPartsAndMakeSummary$(services)), insertSummaryLayout());
    }
};
// todo refactor: make it to return Either<SummarizeResultCase, DbChatMessage[]>
const getChatMessagesForSummary = (services, chatId) => async () => {
    const summaries = await services.db.getSummariesFrom(chatId, yesterday());
    if (summaries.length > getEnv().MAX_SUMMARIES_PER_DAY - 1) {
        return { type: 'tooManySummaries' };
    }
    const lastSummaryDate = summaries.at(-1)?.date ?? yesterday();
    const startSummaryFrom = maxTime([lastSummaryDate, yesterday()]);
    return await services.db.getChatMessages(chatId, startSummaryFrom);
};
const formatChatMessages = (messages) => messages.map((msg) => getFormattedMessage(msg)).join('\n');
const rejectOverflowedSummaryPartsAndMakeSummary$ = _.curry((services, parts) => {
    const maxSummaryParts = getEnv().MAX_SUMMARY_PARTS;
    const allowedParts = _.takeRight(parts, maxSummaryParts);
    const gptQueryParts = mapSummaryPartsToGptQuery(allowedParts);
    return concat(parts.length > maxSummaryParts
        ? of({ type: 'tooManySummaryParts', count: parts.length })
        : [], from(gptQueryParts).pipe(concatMap(querySummaryPartFromGptAndReEnumerateResponse$(services))));
});
const querySummaryPartFromGptAndReEnumerateResponse$ = _.curry((services, { text, pointsCount, index }) => sendMessageToGptWithRetries$({ gpt: services.gpt, text }).pipe(map((gptResultCase) => gptResultCase.type === 'responseFromGPT'
    ? {
        ...gptResultCase,
        text: reEnumerateText(gptResultCase.text.trim(), index * pointsCount + 1),
    }
    : gptResultCase)));
const handleSummaryResultCase = (services, chatId) => async (resultCase) => {
    const logArgs = getLogMessageForSummarizeResultCase(resultCase, chatId);
    if (logArgs !== undefined)
        logger.log(...logArgs);
    await Promise.all([
        resultCase.type === 'summaryHeader' &&
            services.db.createSummary(chatId, new Date()),
        services.telegramBot.sendMessage(chatId, getBotMessageForSummarizeResultCase(resultCase)),
    ]);
};
function getLogMessageForSummarizeResultCase(resultCase, chatId) {
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
function getBotMessageForSummarizeResultCase(resultCase) {
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
        case 'fewMessages': {
            return t('summarize.errors.fewMessages', {
                count: getEnv().MIN_MESSAGES_COUNT_TO_SUMMARIZE,
            });
        }
        case 'noMessages': {
            return t('summarize.errors.noMessages');
        }
        case 'tooManySummaries': {
            return t('summarize.errors.maxSummariesPerDayExceeded', {
                count: getEnv().MAX_SUMMARIES_PER_DAY,
            });
        }
        case 'tooManySummaryParts': {
            return t('summarize.message.tooManyMessages');
        }
    }
}
const mapSummaryPartsToGptQuery = (parts) => parts.map(({ text, pointsCount }, index) => ({
    pointsCount,
    index,
    text: t(pointsCount === 1 ? 'summarize.gptQuery' : 'summarize.gptQueryWithPoints', {
        pointsCount,
        text,
    }),
}));
// todo make this function more expressive
const insertSummaryLayout = () => pipe(startWith({ type: 'startSummary' }), insertBefore({ type: 'summaryHeader' }, (c) => c.type === 'responseFromGPT'), endWithAfter((c) => c.type === 'responseFromGPT', {
    type: 'endSummary',
}));
