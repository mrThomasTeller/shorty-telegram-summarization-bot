import { mock } from 'jest-mock-extended';
import type TelegramBotService from '../../../services/TelegramBotService.ts';
import type TelegramBot from 'node-telegram-bot-api';
import { getEnv } from '../../../config/envVars.ts';
import type DbService from '../../../services/DbService.ts';
import type GptService from '../../../services/GptService.ts';
import { setTimeout } from 'node:timers/promises';

export type TestContext = ReturnType<typeof createContext>;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export default function createContext() {
  const { telegramBot, simulateChatMessage } = createTelegramBotServiceMock();
  const db = createDbServiceMock();
  const gpt = mock<GptService>();

  return {
    telegramBot,
    db,
    gpt,
    simulateChatMessage,
  };
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function createDbServiceMock() {
  const service = mock<DbService>();

  service.getOrCreateUser.mockImplementation(async (user) => [
    {
      id: BigInt(user.id),
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
      username: user.username ?? null,
    },
    false,
  ]);

  service.getOrCreateChat.mockImplementation(async (chatId) => [
    {
      id: BigInt(chatId),
    },
    false,
  ]);

  service.createChatMessageIfNotExists.mockResolvedValue(undefined);

  service.hasMessage.mockResolvedValue(false);

  return service;
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function createTelegramBotServiceMock() {
  const service = mock<TelegramBotService>();

  // eslint-disable-next-line unicorn/consistent-function-scoping
  const initialSimulateChatMessage = (msg: TelegramBot.Message): Promise<TelegramBot.Message> =>
    Promise.resolve(msg);
  let simulateChatMessage = initialSimulateChatMessage;

  service.getUsername.mockResolvedValue(getEnv().BOT_NAME);

  service.onAnyMessage.mockImplementation((callback) => {
    simulateChatMessage = async (msg) => {
      callback(msg);
      await setTimeout(0);
      return msg;
    };

    return () => {
      simulateChatMessage = initialSimulateChatMessage;
    };
  });

  return {
    telegramBot: service,
    simulateChatMessage: (msg: TelegramBot.Message): Promise<TelegramBot.Message> =>
      simulateChatMessage(msg),
  };
}
