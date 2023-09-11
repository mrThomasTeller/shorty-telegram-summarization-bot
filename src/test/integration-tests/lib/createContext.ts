import { mock } from 'jest-mock-extended';
import type TelegramBotService from '../../../services/TelegramBotService';
import type TelegramBot from 'node-telegram-bot-api';
import { getEnv } from '../../../config/env';
import type DbService from '../../../services/DbService';
import type GptService from '../../../services/GptService';

export type TestContext = ReturnType<typeof createContext>;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export default function createContext() {
  const { telegramBotService, simulateChatMessage } = createTelegramBotServiceMock();
  const dbService = createDbServiceMock();
  const gptService = mock<GptService>();

  return {
    telegramBotService,
    dbService,
    gptService,
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

  let simulateChatMessage = (msg: TelegramBot.Message): Promise<TelegramBot.Message> =>
    Promise.resolve(msg);

  service.getUsername.mockResolvedValue(getEnv().BOT_NAME);

  service.onAnyMessage.mockImplementation(async (callback) => {
    simulateChatMessage = (msg) => callback(msg).then(() => msg);
  });

  return {
    telegramBotService: service,
    simulateChatMessage: (msg: TelegramBot.Message): Promise<TelegramBot.Message> =>
      simulateChatMessage(msg),
  };
}