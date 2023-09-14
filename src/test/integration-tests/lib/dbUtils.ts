import type TelegramBot from 'node-telegram-bot-api';
import type DbChatMessage from '../../../lib/types/DbChatMessage';
import { myTgGroupId, myTgUser } from './tgUtils';
import { yesterday } from '../../../lib/utils';

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
    text,
    date,
    userId: BigInt(user.id),
    chatId: BigInt(chatId),
    from: {
      id: BigInt(user.id),
      firstName: user.first_name,
      lastName: user.last_name ?? null,
      username: user.username ?? null,
    },
  };
}

export const mapTgMessagesToDbMessages = (
  tgMessages: TelegramBot.Message[],
  from: Date = yesterday()
): DbChatMessage[] =>
  tgMessages
    .filter((tgMessage) => tgMessage.date >= from.getTime() / 1000)
    .map((tgMessage) =>
      createDbMessageInGroup({
        text: tgMessage.text ?? '',
        messageId: tgMessage.message_id,
        date: new Date(tgMessage.date * 1000),
        user: tgMessage.from,
      })
    );
