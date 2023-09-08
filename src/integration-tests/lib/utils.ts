import type TelegramBot from 'node-telegram-bot-api';
import type DbChatMessage from '../../lib/types/DbChatMessage';
import { type ChatMessage } from 'chatgpt';
import _ from 'lodash';

export const myTgUserId = 111;
export const myTgGroupId = 222;
export const otherTgUserId = 333;
export const otherTgGroupId = 444;
export const myFirstName = 'Артём';
export const myLastName = 'Бахарев';
export const myFullName = `${myFirstName} ${myLastName}`;
export const myUserName = 'mrThomasTeller';

let messageId = 0;
export function createTgMessageInGroup({
  text,
  chatId = myTgGroupId,
  userId = myTgUserId,
  date = new Date(),
}: {
  text: string;
  chatId?: number;
  userId?: number;
  date?: Date;
}): TelegramBot.Message {
  return {
    message_id: ++messageId,
    from: {
      id: userId,
      is_bot: false,
      first_name: myFirstName,
      last_name: myLastName,
      username: myUserName,
      language_code: 'en',
    },
    chat: {
      id: chatId,
      title: 'Test Summarize Bot dev',
      type: 'supergroup',
    },
    date: date.getTime() / 1000,
    text,
  };
}

export function createDbMessageInGroup({
  text,
  messageId,
  chatId = myTgGroupId,
  userId = myTgUserId,
  date = new Date(),
}: {
  text: string;
  messageId: bigint | number;
  chatId?: bigint | number;
  userId?: bigint | number;
  date?: Date;
}): DbChatMessage {
  return {
    messageId: BigInt(messageId),
    text,
    date,
    userId: BigInt(userId),
    chatId: BigInt(chatId),
    from: {
      id: BigInt(userId),
      firstName: myFirstName,
      lastName: myLastName,
      username: myUserName,
    },
  };
}

export function createGptChatMessage(text: string): ChatMessage {
  return {
    role: 'assistant',
    id: _.uniqueId('gpt-mock-'),
    conversationId: undefined,
    parentMessageId: _.uniqueId('gpt-mock-'),
    text,
  };
}
