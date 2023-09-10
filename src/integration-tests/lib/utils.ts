import type TelegramBot from 'node-telegram-bot-api';
import type DbChatMessage from '../../lib/types/DbChatMessage';
import { type ChatMessage } from 'chatgpt';
import _ from 'lodash';
import { required } from '../../lib/utils.js';

export const myTgUser: TelegramBot.User = {
  id: 111,
  is_bot: false,
  first_name: 'Артём',
  last_name: 'Бахарев',
  username: 'mrThomasTeller',
  language_code: 'en',
};
export const myFullName = `${myTgUser.first_name} ${required(myTgUser.last_name)}`;

export const otherTgUser: TelegramBot.User = {
  id: 333,
  is_bot: false,
  first_name: 'Иван',
  last_name: 'Иванов',
  username: 'vanya',
  language_code: 'en',
};
export const otherFullName = `${otherTgUser.first_name} ${required(otherTgUser.last_name)}`;

export const myTgGroupId = 222;
export const otherTgGroupId = 444;

let messageId = 0;
export function createTgMessageInGroup({
  text,
  chatId = myTgGroupId,
  user = myTgUser,
  date = new Date(),
}: {
  text: string;
  chatId?: number;
  user?: TelegramBot.User;
  date?: Date;
}): TelegramBot.Message {
  return {
    message_id: ++messageId,
    from: user,
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

export function createGptChatMessage(text: string): ChatMessage {
  return {
    role: 'assistant',
    id: _.uniqueId('gpt-mock-'),
    conversationId: undefined,
    parentMessageId: _.uniqueId('gpt-mock-'),
    text,
  };
}
