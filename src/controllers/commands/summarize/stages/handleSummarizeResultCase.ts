import { type TranslationKey, t } from '../../../../config/translations/index.ts';
import type Services from '../../../../services/Services.ts';
import logger, { type LogLevel } from '../../../../config/logger.ts';
import { getEnv } from '../../../../config/envVars.ts';
import { formatSummaryFromGpt } from '../../../../data/summaryUtils.ts';
import { setTimeout } from 'node:timers/promises';
import {
  type EndSummarySummarizeResultCase,
  type SummarizeResultCase,
} from '../types/SummarizeResultCase.ts';
import { match } from 'ts-pattern';
import type TelegramBot from 'node-telegram-bot-api';

const handleSummarizeResultCase =
  (services: Services, msg: TelegramBot.Message) => async (resultCase: SummarizeResultCase) => {
    const logArgs = getLogMessageForSummarizeResultCase(resultCase, msg.chat.id, msg.from?.id);
    if (logArgs !== undefined) logger.log(...logArgs);

    if (resultCase.type === 'summaryHeader') {
      await services.db.createSummary({
        chatId: msg.chat.id,
        userId: resultCase.userPremium ? msg.from?.id : undefined,
        date: new Date(),
        usedPremium: resultCase.usedPremium,
      });
    }

    const text = getBotMessageForSummarizeResultCase(resultCase);

    await services.telegramBot.sendMessage(
      msg.chat.id,
      text,
      resultCase.type === 'responseFromGPT'
        ? undefined
        : {
            parse_mode: 'HTML',
          }
    );

    if (resultCase.type === 'ads') {
      await setTimeout(getEnv().TIME_TO_SHOW_ADS);
      await services.ads.showAds(msg.chat.id);
    }
  };

export default handleSummarizeResultCase;

function getLogMessageForSummarizeResultCase(
  resultCase: SummarizeResultCase,
  chatId: number,
  userId: number | undefined
): [level: LogLevel, message: string] | undefined {
  switch (resultCase.type) {
    case 'unknownError': {
      return ['error', resultCase.error.message];
    }
    case 'tooManyRequests': {
      return ['error', `Too many requests to GPT for chat ${chatId}`];
    }
    case 'startSummary': {
      return ['info', t('summarize.debug.queryInfo', { chatId, userId })];
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
      return t(getEndSummaryTranslationKey(resultCase), {
        free: resultCase.freeSummariesRest,
        freeTotal: getEnv().MAX_SUMMARIES_PER_WEEK,
        premium: resultCase.premiumSummariesRest,
      });
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
      return t(
        resultCase.hasPremium
          ? 'summarize.errors.maxSummariesExceeded.premium'
          : 'summarize.errors.maxSummariesExceeded.free',
        {
          count: getEnv().MAX_SUMMARIES_PER_WEEK,
        }
      );
    }
    case 'tooManySummaryParts': {
      return t('summarize.message.tooManyMessages');
    }
    case 'ads': {
      return t('summarize.message.dontShowAds');
    }
  }
}

const getEndSummaryTranslationKey = (resultCase: EndSummarySummarizeResultCase): TranslationKey =>
  match<EndSummarySummarizeResultCase, TranslationKey>(resultCase)
    .with({ hasPremium: false }, () => 'summarize.message.end.free')
    .with(
      { freeSummariesRest: 0, premiumSummariesRest: 0 },
      () => 'summarize.message.end.premiumEnded'
    )
    .with({ freeSummariesRest: 0 }, () => 'summarize.message.end.premiumNoFree')
    .otherwise(() => 'summarize.message.end.premiumWithFree');
