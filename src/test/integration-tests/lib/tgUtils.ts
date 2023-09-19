import type TelegramBot from 'node-telegram-bot-api';
import { required, yesterdayBeforeYesterday } from '../../../lib/utils.ts';
import { getEnv } from '../../../config/env.ts';
import _ from 'lodash';

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

export const createSummarizeCommandMessage = (user: TelegramBot.User): TelegramBot.Message =>
  createTgMessageInGroup({ text: `/summarize@${getEnv().BOT_NAME}`, user });

export const createTgMessages = (
  currentCount: number,
  outdatedCount: number = 10
): TelegramBot.Message[] =>
  _.range(-outdatedCount + 1, currentCount).map((num) =>
    createTgMessageInGroup({
      text: `Message: ${num}. Text: ${'a'.repeat(100)}}`,
      user: num % 2 === 0 ? myTgUser : otherTgUser,
      date: num < 1 ? yesterdayBeforeYesterday() : new Date(),
    })
  );
