import summarizeBotServer from '../entryPoints/summarizeBotServer.js';
import type TelegramBotService from '../services/TelegramBotService.js';
import { mock } from 'jest-mock-extended';
import type TelegramBot from 'node-telegram-bot-api';
import createDbServiceMock from './createDbServiceMock.js';
import { getEnv } from '../config/env.js';

export const myTgUserId = 111;
export const myTgGroupId = 222;
export const otherTgUserId = 333;
export const otherTgGroupId = 444;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function createContext() {
  const telegramBotService = mock<TelegramBotService>();
  const dbService = createDbServiceMock();

  telegramBotService.getUsername.mockResolvedValue(getEnv().BOT_NAME);

  return {
    telegramBotService,
    dbService,
    run: () =>
      summarizeBotServer({
        telegramBotService,
        dbService,
      }),
  };
}

let messageId = 0;
export function createMessageInGroup(text: string, chatId: number): TelegramBot.Message {
  return {
    message_id: ++messageId,
    from: {
      id: myTgUserId,
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
    date: new Date().getTime(),
    text,
    entities: [{ offset: 0, length: text.length, type: 'bot_command' }],
  };
}
