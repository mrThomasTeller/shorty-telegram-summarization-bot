import { max as maxTime } from 'date-fns';
import { either } from 'fp-ts';
import { type Either } from 'fp-ts/lib/Either';
import _ from 'lodash';
import type TelegramBot from 'node-telegram-bot-api';
import type DbChatMessage from '../../../../data/types/DbChatMessage.ts';
import { yesterday } from '../../../../lib/date.ts';
import type Services from '../../../../services/Services.ts';
import { type ChatMessagesForSummaryData } from '../types/ChatMessagesForSummaryData.ts';
import { type LimitsData } from '../../../../data/types/LimitsData.ts';
import { type SummarizeResultCase } from '../types/SummarizeResultCase.ts';

export const getChatMessagesForSummary = _.curry(
  async (
    services: Services,
    msg: TelegramBot.Message,
    limits: LimitsData
  ): Promise<Either<SummarizeResultCase, ChatMessagesForSummaryData>> => {
    // fixme cover
    const summariesRest =
      limits.premiumSummariesRest > 0 ? limits.premiumSummariesRest : limits.freeSummariesRest;

    if (summariesRest <= 0) {
      return either.left({ type: 'tooManySummaries', hasPremium: !!limits.subscription });
    }

    const startSummaryFrom = maxTime([limits.lastSummaryDate ?? yesterday(), yesterday()]);

    // fixme если сообщения были отброшены нужно уведомить пользователя
    const allMessages = await services.db.getChatMessages(msg.chat.id, startSummaryFrom);
    const messages = dropOverflowedMessages(
      allMessages,
      limits.maxTextToSummarizeApproximateLength
    );

    return either.right({
      ...limits,
      messages,
      premiumSummariesRest: Math.max(limits.premiumSummariesRest - 1, 0),
      freeSummariesRest:
        limits.premiumSummariesRest > 0 ? limits.freeSummariesRest : limits.freeSummariesRest - 1,
      usedPremium: limits.premiumSummariesRest > 0,
    });
  }
);

const dropOverflowedMessages = (messages: DbChatMessage[], maxLength: number): DbChatMessage[] =>
  [...messages].reverse().reduce(
    (acc, msg) => {
      // зашифрованное сообщение больше исходного примерно на 20-30 символов
      const msgTextLength = Math.max(msg.text?.length ?? 0 - 30, 0);

      return acc.length + msgTextLength > maxLength
        ? acc
        : {
            length: acc.length + msgTextLength,
            messages: [msg, ...acc.messages],
          };
    },
    { length: 0, messages: [] as DbChatMessage[] }
  ).messages;
