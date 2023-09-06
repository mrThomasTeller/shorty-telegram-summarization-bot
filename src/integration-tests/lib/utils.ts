import type TelegramBot from 'node-telegram-bot-api';

export const myTgUserId = 111;
export const myTgGroupId = 222;
export const otherTgUserId = 333;
export const otherTgGroupId = 444;

let messageId = 0;
export function createMessageInGroup({
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
      first_name: 'Артём',
      last_name: 'Бахарев',
      username: 'mrThomasTeller',
      language_code: 'en',
    },
    chat: {
      id: chatId,
      title: 'Test Summarize Bot dev',
      type: 'supergroup',
    },
    date: date.getTime(),
    text,
  };
}
