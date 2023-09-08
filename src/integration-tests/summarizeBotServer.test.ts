import { getPingResponseMessage } from '../commands/ping.js';
import {
  createDbMessageInGroup,
  createGptChatMessage,
  createTgMessageInGroup,
  myFullName,
  myTgGroupId,
  myTgUserId,
  otherTgUserId,
} from './lib/utils.js';
import { getMaintenanceMessage } from '../entryPoints/summarizeBotServer.js';
import { getEnv, setWhiteChatsList } from '../config/env.js';
import createContext, { type TestContext } from './lib/createContext.js';
import { yesterday, yesterdayBeforeYesterday, required } from '../lib/utils.js';
import {
  getEndSummarizeMessage,
  getStartSummarizeMessage,
  getSummaryHeader,
  getSummaryQueryMessage,
} from '../commands/summarize.js';
import type TelegramBot from 'node-telegram-bot-api';

describe('summarizeBotServer', () => {
  beforeAll(() => {
    setWhiteChatsList([myTgUserId, myTgGroupId]);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('respond to messages from non-white chats with maintenance message', async () => {
    const { telegramBotService, simulateChatMessage } = await createContext();

    await simulateChatMessage(
      createTgMessageInGroup({ text: `/ping@${getEnv().BOT_NAME}`, chatId: otherTgUserId })
    );

    expect(telegramBotService.sendMessage).toHaveBeenCalledWith(
      otherTgUserId,
      getMaintenanceMessage()
    );
  });

  it('/ping command is correct', async () => {
    const { telegramBotService, simulateChatMessage } = await createContext();

    await simulateChatMessage(createTgMessageInGroup({ text: `/ping@${getEnv().BOT_NAME}` }));

    expect(telegramBotService.sendMessage).toHaveBeenCalledWith(
      myTgGroupId,
      getPingResponseMessage()
    );
  });

  describe('/summarize command', () => {
    it('without messages', async () => {
      const { telegramBotService, dbService, gptService, simulateChatMessage } =
        await createContext();

      dbService.getChatMessages.mockResolvedValue([]);

      // send summarize command
      await simulateChatMessage(createSummarizeCommandMessage(myTgUserId));

      // bot should retrieve messages from db
      expectBotHasRetrievedMessagesFromDb(dbService);

      // bot shouldn't query summary from gpt
      expect(gptService.sendMessage).not.toHaveBeenCalled();

      // bot should send summarization messages
      expectTgBotServiceHasSentMessages(telegramBotService, myTgGroupId, [
        getStartSummarizeMessage(),
        getEndSummarizeMessage(),
      ]);
    });

    it('with a few messages', async () => {
      const { telegramBotService, dbService, gptService, simulateChatMessage } =
        await createContext();

      // fixme extract it to separate function
      const tgMessages = [
        createTgMessageInGroup({
          text: `one`,
          userId: myTgUserId,
          date: yesterdayBeforeYesterday(),
        }),
        createTgMessageInGroup({ text: `two`, userId: otherTgUserId }),
        createTgMessageInGroup({ text: `three`, userId: myTgUserId }),
        createTgMessageInGroup({ text: `four`, userId: otherTgUserId }),
      ];

      // send four messages
      for (const tgMessage of tgMessages) {
        await simulateChatMessage(tgMessage);
      }

      const dbMessages = tgMessages.slice(1).map((tgMessage) =>
        createDbMessageInGroup({
          text: tgMessage.text ?? '',
          messageId: tgMessage.message_id,
          date: new Date(tgMessage.date * 1000),
          userId: tgMessage.from?.id,
        })
      );

      dbService.getChatMessages.mockResolvedValue(dbMessages);

      gptService.sendMessage.mockResolvedValue(createGptChatMessage('gpt test summary'));

      // send summarize command
      await simulateChatMessage(
        createTgMessageInGroup({ text: `/summarize@${getEnv().BOT_NAME}`, userId: myTgUserId })
      );

      // bot should create two users
      expect(dbService.getOrCreateUser).toHaveBeenCalledWith(
        expect.objectContaining({
          id: myTgUserId,
        })
      );
      expect(dbService.getOrCreateUser).toHaveBeenCalledWith(
        expect.objectContaining({
          id: otherTgUserId,
        })
      );

      // bot should create one chat
      expect(dbService.getOrCreateChat).toHaveBeenCalledWith(myTgGroupId);

      // bot should create four messages
      for (const tgMessage of tgMessages) {
        expect(dbService.createChatMessageIfNotExists).toHaveBeenCalledWith(
          expect.objectContaining({
            text: tgMessage.text,
            userId: BigInt(required(tgMessage.from?.id)),
          })
        );
      }

      expectBotHasRetrievedMessagesFromDb(dbService);

      // fixme use another fullname here
      // bot should query summary from gpt
      expect(gptService.sendMessage).toHaveBeenCalledWith(
        getSummaryQueryMessage(
          5,
          `${myFullName}: two
${myFullName}: three
${myFullName}: four`
        ),
        expect.objectContaining({
          completionParams: { max_tokens: 2048 },
        })
      );

      // bot should send summarization messages
      expectTgBotServiceHasSentMessages(telegramBotService, myTgGroupId, [
        getStartSummarizeMessage(),
        getSummaryHeader(),
        'gpt test summary',
        getEndSummarizeMessage(),
      ]);
    });
  });
});

const createSummarizeCommandMessage = (userId: number): TelegramBot.Message =>
  createTgMessageInGroup({ text: `/summarize@${getEnv().BOT_NAME}`, userId });

function expectBotHasRetrievedMessagesFromDb(dbService: TestContext['dbService']): void {
  const [getChatMessagesChatId, getChatMessagesFromDate] = dbService.getChatMessages.mock.calls[0];
  expect(getChatMessagesChatId).toBe(myTgGroupId);
  expect(getChatMessagesFromDate?.getTime()).toBeCloseTo(yesterday().getTime(), -4);
}

function expectTgBotServiceHasSentMessages(
  telegramBotService: TestContext['telegramBotService'],
  userId: number,
  messages: string[]
): void {
  messages.forEach((message, index) => {
    expect(telegramBotService.sendMessage).toHaveBeenNthCalledWith(index + 1, userId, message);
  });
}
