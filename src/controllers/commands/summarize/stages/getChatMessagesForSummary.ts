import { max as maxTime } from 'date-fns';
import { either } from 'fp-ts';
import { type Either } from 'fp-ts/lib/Either';
import _ from 'lodash';
import logger from '../../../../config/logger';
import type DbChatMessage from '../../../../data/types/DbChatMessage';
import { type LimitsData } from '../../../../data/types/LimitsData';
import { yesterday } from '../../../../lib/common/date';
import { required } from '../../../../lib/common/lang';
import type Services from '../../../../services/Services';
import { type ChatSettings } from '../../../../data/types/ChatSettings';
import { type ChatMessagesForSummaryData } from '../types/ChatMessagesForSummaryData';
import { type SummarizeResultCase } from '../types/SummarizeResultCase';
import type { TgMessageType } from '../types/TgMessageType';

export const getChatMessagesForSummary = _.curry(
  async (
    services: Services,
    msg: TgMessageType,
    limits: LimitsData
  ): Promise<Either<SummarizeResultCase, ChatMessagesForSummaryData>> => {
    const chat = await services.db.getChat(msg.chat.id);
    const settings = required(chat?.settings) as ChatSettings;

    if (settings.summarizeAdminsOnly) {
      const admins = await services.telegramBot.getChatAdministrators(msg.chat.id);
      if (!admins.some((admin) => admin.user.id === msg.from?.id)) {
        return either.left({ type: 'adminsOnly' });
      }
    }

    const summariesRest =
      limits.premiumSummariesRest > 0 ? limits.premiumSummariesRest : limits.freeSummariesRest;

    if (summariesRest <= 0) {
      return either.left({ type: 'tooManySummaries', hasPremium: !!limits.subscription });
    }

    const startSummaryFrom = maxTime([limits.lastSummaryDate ?? yesterday(), yesterday()]);

    const allMessages = await services.db.getChatMessages(msg.chat.id, startSummaryFrom);
    const messages = dropOverflowedMessages(
      allMessages,
      limits.maxTextToSummarizeApproximateLength
    );

    logChatMessagesLoad(msg.chat.id, allMessages.length, messages.length, startSummaryFrom);

    return either.right({
      ...limits,
      allMessagesCount: allMessages.length,
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

function logChatMessagesLoad(
  chatId: number,
  allMessagesCount: number,
  selectedMessagesCount: number,
  startSummaryFrom: Date
): void {
  const memory = process.memoryUsage();
  logger.info(
    `[summarize-memory] stage=db_messages_loaded chatId=${chatId} startFrom=${startSummaryFrom.toISOString()} allMessages=${allMessagesCount} selectedMessages=${selectedMessagesCount} rss=${memory.rss} heapUsed=${memory.heapUsed} heapTotal=${memory.heapTotal} external=${memory.external} arrayBuffers=${memory.arrayBuffers}`
  );
}
