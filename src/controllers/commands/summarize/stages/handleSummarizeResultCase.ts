import type TelegramBot from 'node-telegram-bot-api';
import { setTimeout } from 'node:timers/promises';
import { getEnv } from '../../../../config/envVars.ts';
import logger, { type LogLevel } from '../../../../config/logger.ts';
import { t } from '../../../../config/translations/index.ts';
import { getSummariesRestText } from '../../../../data/subscriptionLimits.ts';
import { formatSummaryFromGpt } from '../../../../data/summaryUtils.ts';
import { required } from '../../../../lib/common/lang.ts';
import type Services from '../../../../services/Services.ts';
import { type SummarizeResultCase } from '../types/SummarizeResultCase.ts';
import { encryptIfExists } from '../../../../data/encryption.ts';

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

      await services.db.updateChat(msg.chat.id, {
        unsummarizedSymbols: 0,
        notifiedItsTimeToSummarize: false,
        title: encryptIfExists(msg.chat.title),
      });
    }

    const botName = required(await services.telegramBot.getUsername(), 'Bot name is required');
    const text = getBotMessageForSummarizeResultCase(resultCase, msg, botName);

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

function getBotMessageForSummarizeResultCase(
  resultCase: SummarizeResultCase,
  msg: TelegramBot.Message,
  botName: string
): string {
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
      return `${t('summarize.message.end')}\n${getSummariesRestText(
        resultCase,
        msg.chat.id,
        botName
      )}`;
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
          botName,
          chatId: msg.chat.id,
        }
      );
    }
    case 'tooManySummaryParts': {
      return t('summarize.message.tooManyMessages', {
        botName,
        chatId: msg.chat.id,
      });
    }
    case 'ads': {
      return t('summarize.message.dontShowAds');
    }
  }
}
