import type TelegramBot from 'node-telegram-bot-api';
import { required } from '../../../lib/common.js';
import _ from 'lodash';
import formatDate from 'date-fns/format';
import { botName, tgMessageLength } from './constants.js';

export type TestTgMessage = TelegramBot.Message & {
  shouldBeSkipped?: boolean;
};

export const myTgUser: TelegramBot.User = {
  id: 111,
  is_bot: false,
  first_name: 'Артём',
  last_name: 'Бахарев',
  username: 'mrThomasTeller',
  language_code: 'en',
};
export const myFullName = `${myTgUser.first_name} ${required(
  myTgUser.last_name
)}`;

export const otherTgUser: TelegramBot.User = {
  id: 333,
  is_bot: false,
  first_name: 'Иван',
  last_name: 'Иванович',
  username: 'vanya',
  language_code: 'en',
};
export const otherFullName = `${otherTgUser.first_name} ${required(
  otherTgUser.last_name
)}`;

export const myTgGroupId = 222;
export const myTgGroup2Id = 223;
export const otherTgGroupId = 444;

let messageId = 0;
export function createTgMessageInGroup({
  text,
  chatId = myTgGroupId,
  user = myTgUser,
  date = new Date(),
  shouldBeSkipped = false,
}: {
  text: string;
  chatId?: number;
  user?: TelegramBot.User;
  date?: Date;
  shouldBeSkipped?: boolean;
}): TestTgMessage {
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
    shouldBeSkipped,
  };
}

export const createSummarizeCommandMessage = (
  user: TelegramBot.User,
  chatId: number = myTgGroupId
): TelegramBot.Message =>
  createTgMessageInGroup({ text: `/summarize@${botName}`, user, chatId });

export type TgMessagesBunchDesc = {
  date: Date;
  count: number;
  shouldBeSkipped?: boolean;
};

export function createTgMessages(
  currentCountOrBunches: number | TgMessagesBunchDesc[],
  chatId: number = myTgGroupId
): TestTgMessage[] {
  if (typeof currentCountOrBunches === 'number') {
    return createTgMessages(
      [{ date: new Date(), count: currentCountOrBunches }],
      chatId
    );
  }

  const tgMessagesDates = currentCountOrBunches.flatMap((bunch) =>
    _.range(bunch.count).map(() => ({
      date: bunch.date,
      shouldBeSkipped: bunch.shouldBeSkipped,
    }))
  );

  return tgMessagesDates.map(({ date, shouldBeSkipped }, num) =>
    createTgMessageInGroup({
      text: createSampleText(num, date),
      user: num % 2 === 0 ? myTgUser : otherTgUser,
      date,
      shouldBeSkipped,
      chatId,
    })
  );
}

function createSampleText(num: number, date: Date): string {
  const prefix = `Message: ${num}. Date: ${formatDate(
    date,
    'dd.mm.yyyy HH:mm'
  )}. Text: `;
  return `${prefix}${'a'.repeat(tgMessageLength - prefix.length)}`;
}
