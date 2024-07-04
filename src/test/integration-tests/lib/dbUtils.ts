import type TelegramBot from 'node-telegram-bot-api';
import type DbChatMessage from '../../../data/types/DbChatMessage.ts';
import { myTgGroupId, myTgUser, type TestTgMessage } from './tgUtils.ts';
import { encrypt, encryptIfExists } from '../../../data/encryption.ts';
import _ from 'lodash';
import { daysAgo, hoursAgo } from '../../../lib/date.ts';
import { type Summary } from '@prisma/client';

export function createDbMessageInGroup({
  text,
  messageId,
  chatId = myTgGroupId,
  user = myTgUser,
  date = new Date(),
}: {
  text: string;
  messageId: bigint | number;
  chatId?: bigint | number;
  user?: TelegramBot.User;
  date?: Date;
}): DbChatMessage {
  return {
    messageId: BigInt(messageId),
    text: encrypt(text),
    date,
    userId: BigInt(user.id),
    chatId: BigInt(chatId),
    from: {
      id: BigInt(user.id),
      firstName: encrypt(user.first_name),
      lastName: encryptIfExists(user.last_name) ?? null,
      username: encryptIfExists(user.username) ?? null,
    },
  };
}

export const mapTgMessagesToDbMessages = (
  tgMessages: TestTgMessage[]
): {
  all: DbChatMessage[];
  actual: DbChatMessage[];
} => {
  const messagesData = tgMessages.map((tgMessage) => ({
    message: createDbMessageInGroup({
      text: tgMessage.text ?? '',
      messageId: tgMessage.message_id,
      date: new Date(tgMessage.date * 1000),
      user: tgMessage.from,
      chatId: tgMessage.chat.id,
    }),
    shouldBeSkipped: Boolean(tgMessage.shouldBeSkipped),
  }));

  return {
    all: messagesData.map((d) => d.message),
    actual: messagesData.filter((d) => !d.shouldBeSkipped).map((d) => d.message),
  };
};

export function createSummaries(
  chatId: number,
  actualCount: number,
  outdatedCount: number = 0
): Summary[] {
  return [
    ..._.range(outdatedCount).map(
      (index): Summary => ({
        id: index + 1,
        date: daysAgo(2),
        chatId: BigInt(chatId),
        usedPremium: false,
        userId: BigInt(myTgUser.id),
      })
    ),
    ..._.range(actualCount).map(
      (index): Summary => ({
        id: index + outdatedCount + 1,
        date: hoursAgo(1),
        chatId: BigInt(chatId),
        usedPremium: false,
        userId: BigInt(myTgUser.id),
      })
    ),
  ];
}
