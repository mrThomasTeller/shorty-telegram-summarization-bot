import { mock } from 'jest-mock-extended';
import type TelegramBotService from '../../../services/TelegramBotService.ts';
import type TelegramBot from 'node-telegram-bot-api';
import type DbService from '../../../services/DbService.ts';
import type GptService from '../../../services/GptService.ts';
import { setTimeout } from 'node:timers/promises';
import type DbChatMessage from '../../../data/DbChatMessage.ts';
import fp_ from 'lodash/fp.js';
import { type User, type Summary } from '@prisma/client';
import { type MessageCreateInput } from '../../../services/DbService.ts';
import { myTgUser, otherTgUser } from './tgUtils.ts';
import { encrypt, encryptIfExists } from '../../../data/encryption.ts';
import { botName } from './constants.ts';

export type TestContext = ReturnType<typeof createContext>;

// todo move all mocks factories to separate files
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export default function createContext() {
  const { telegramBot, simulateChatMessage, simulateAddedToChat } = createTelegramBotServiceMock();
  const db = createDbServiceMock();
  const gpt = createGptServiceMock();

  return {
    telegramBot,
    db,
    gpt,
    simulateChatMessage,
    simulateAddedToChat,
  };
}

let lastSummaryId = 0;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function createDbServiceMock() {
  const service = Object.assign(mock<DbService>(), {
    messages: [] as DbChatMessage[],
    summaries: [] as Summary[],
    users: [] as User[],
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

  service.getOrCreateUser.mockImplementation(async (userInput) => {
    const user = service.users.find((u) => u.id === BigInt(userInput.id));

    if (user) {
      return [user, false];
    }

    const newUser = {
      id: BigInt(userInput.id),
      firstName: userInput.firstName ?? null,
      lastName: userInput.lastName ?? null,
      username: userInput.username ?? null,
    };

    service.users.push(newUser);

    return [newUser, true];
  });

  service.hasMessage.mockImplementation(async (messageId, chatId) =>
    service.messages.some(
      (msg) => msg.messageId === BigInt(messageId) && msg.chatId === BigInt(chatId)
    )
  );

  service.createChatMessageIfNotExists.mockImplementation(
    async (messageInput: MessageCreateInput): Promise<void> => {
      if (await service.hasMessage(Number(messageInput.messageId), Number(messageInput.chatId))) {
        return;
      }

      const user =
        Number(messageInput.userId) === myTgUser.id
          ? myTgUser
          : Number(messageInput.userId) === otherTgUser.id
          ? otherTgUser
          : null;

      const message: DbChatMessage = {
        chatId: BigInt(messageInput.chatId),
        messageId: BigInt(messageInput.messageId),
        userId: messageInput.userId == null ? null : BigInt(messageInput.userId),
        date: new Date(messageInput.date),
        text: messageInput.text ?? null,
        from: user && {
          firstName: encrypt(user.first_name),
          lastName: encryptIfExists(user.last_name) ?? null,
          username: encryptIfExists(user.username) ?? null,
          id: BigInt(user.id),
        },
      };

      service.messages.push(message);
    }
  );

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

const initialSimulateChatMessage = (msg: TelegramBot.Message): Promise<TelegramBot.Message> =>
  Promise.resolve(msg);
const initialSimulateAddedToChat = (_chatId: number): Promise<void> => Promise.resolve();

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function createTelegramBotServiceMock() {
  const service = mock<TelegramBotService>();

  let simulateChatMessage = initialSimulateChatMessage;
  let simulateAddedToChat = initialSimulateAddedToChat;

  service.getUsername.mockResolvedValue(botName);

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

  service.onAddedToChat.mockImplementation((callback) => {
    simulateAddedToChat = async (chatId) => {
      callback(chatId);
      await setTimeout(0);
    };

    return () => {
      simulateAddedToChat = initialSimulateAddedToChat;
    };
  });

  return {
    telegramBot: service,
    simulateChatMessage: (msg: TelegramBot.Message): Promise<TelegramBot.Message> =>
      simulateChatMessage(msg),
    simulateAddedToChat: (chatId: number): Promise<void> => simulateAddedToChat(chatId),
  };
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function createGptServiceMock() {
  const service = mock<GptService>();

  service.sendMessage.mockRejectedValue(new Error('gpt.sendMessage is not mocked'));

  return service;
}
