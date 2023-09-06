import summarizeBotServer from '../../entryPoints/summarizeBotServer.js';
import { setTimeout } from 'timers/promises';
import { mock } from 'jest-mock-extended';
import type TelegramBotService from '../../services/TelegramBotService.js';
import type TelegramBot from 'node-telegram-bot-api';
import { getEnv } from '../../config/env.js';
import type DbService from '../../services/DbService.js';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export default async function createContext() {
  const { telegramBotService, simulateChatMessage } = createTelegramBotServiceMock();
  const dbService = createDbServiceMock();

  void summarizeBotServer({
    telegramBotService,
    dbService,
  });
  await setTimeout(0);

  return {
    telegramBotService,
    dbService,
    simulateChatMessage,
  };
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function createDbServiceMock() {
  const service = mock<DbService>();

  service.getOrCreateUser.mockImplementation(async (user) => ({
    id: BigInt(user.id),
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
    username: user.username ?? null,
  }));

  service.getOrCreateChat.mockImplementation(async (chatId) => ({
    id: BigInt(chatId),
  }));

  service.createChatMessageIfNotExists.mockResolvedValue(undefined);

  return service;
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function createTelegramBotServiceMock() {
  const service = mock<TelegramBotService>();

  let simulateChatMessage: (msg: TelegramBot.Message) => Promise<void> = () => Promise.resolve();

  service.getUsername.mockResolvedValue(getEnv().BOT_NAME);

  service.onAnyMessage.mockImplementation(async (callback) => {
    simulateChatMessage = callback;
  });

  return {
    telegramBotService: service,
    simulateChatMessage: (msg: TelegramBot.Message): Promise<void> => simulateChatMessage(msg),
  };
}
