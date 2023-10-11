import { mock } from 'jest-mock-extended';
import type TelegramBotService from '../../../services/TelegramBotService.ts';
import type TelegramBot from 'node-telegram-bot-api';
import { getEnv } from '../../../config/envVars.ts';
import type DbService from '../../../services/DbService.ts';
import type GptService from '../../../services/GptService.ts';
import { setTimeout } from 'node:timers/promises';
import type DbChatMessage from '../../../data/DbChatMessage.ts';
import fp_ from 'lodash/fp.js';
import { type Summary } from '@prisma/client';

export type TestContext = ReturnType<typeof createContext>;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export default function createContext() {
  const { telegramBot, simulateChatMessage } = createTelegramBotServiceMock();
  const db = createDbServiceMock();
  const gpt = createGptServiceMock();

  return {
    telegramBot,
    db,
    gpt,
    simulateChatMessage,
  };
}

let lastSummaryId = 0;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function createDbServiceMock() {
  const service = Object.assign(mock<DbService>(), {
    messages: [] as DbChatMessage[],
    summaries: [] as Summary[],
  });

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

  service.createSummary.mockImplementation(async (chatId, date) => {
    const summary = {
      id: ++lastSummaryId,
      chatId: BigInt(chatId),
      date,
    };

    service.summaries.push(summary);
    return summary;
  });

  service.getSummariesFrom.mockImplementation(async (chatId, from) =>
    fp_.pipe(
      fp_.filter((summary: Summary) => summary.chatId === BigInt(chatId)),
      fp_.filter((summary) => summary.date >= from),
      fp_.sortBy<Summary>('date')
    )(service.summaries)
  );

  service.getChatMessages.mockImplementation(async (chatId, from) =>
    fp_.pipe(
      fp_.filter((msg: DbChatMessage) => msg.chatId === BigInt(chatId)),
      from ? fp_.filter((msg) => msg.date >= from) : fp_.identity<DbChatMessage[]>
    )(service.messages)
  );

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

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function createGptServiceMock() {
  const service = mock<GptService>();

  service.sendMessage.mockRejectedValue(new Error('gpt.sendMessage is not mocked'));

  return service;
}
