import { getPingResponseMessage } from '../commands/ping.js';
import { createMessageInGroup, myTgGroupId, myTgUserId, otherTgUserId } from './lib/utils.js';
import { getMaintenanceMessage } from '../entryPoints/summarizeBotServer.js';
import { getEnv, setWhiteChatsList } from '../config/env.js';
import createContext from './lib/createContext.js';
import { yesterday, yesterdayBeforeYesterday } from '../lib/utils.js';
import { getEndSummarizeMessage, getStartSummarizeMessage } from '../commands/summarize.js';

describe('summarizeBotServer', () => {
  beforeAll(() => {
    setWhiteChatsList([myTgUserId, myTgGroupId]);
  });

  it('respond to messages from non-white chats with maintenance message', async () => {
    const { telegramBotService, simulateChatMessage } = await createContext();

    await simulateChatMessage(
      createMessageInGroup({ text: `/ping@${getEnv().BOT_NAME}`, chatId: otherTgUserId })
    );

    expect(telegramBotService.sendMessage).toHaveBeenCalledWith(
      otherTgUserId,
      getMaintenanceMessage()
    );
  });

  it('/ping command is correct', async () => {
    const { telegramBotService, simulateChatMessage } = await createContext();

    await simulateChatMessage(createMessageInGroup({ text: `/ping@${getEnv().BOT_NAME}` }));

    expect(telegramBotService.sendMessage).toHaveBeenCalledWith(
      myTgGroupId,
      getPingResponseMessage()
    );
  });

  it('/summarize command is correct', async () => {
    const { telegramBotService, dbService, simulateChatMessage } = await createContext();

    // send four messages
    await simulateChatMessage(
      createMessageInGroup({ text: `one`, userId: myTgUserId, date: yesterdayBeforeYesterday() })
    );
    await simulateChatMessage(createMessageInGroup({ text: `two`, userId: otherTgUserId }));
    await simulateChatMessage(createMessageInGroup({ text: `three`, userId: myTgUserId }));
    await simulateChatMessage(createMessageInGroup({ text: `four`, userId: otherTgUserId }));

    dbService.getChatMessages.mockResolvedValue([]);

    // send summarize command
    await simulateChatMessage(
      createMessageInGroup({ text: `/summarize@${getEnv().BOT_NAME}`, userId: myTgUserId })
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
    expect(dbService.createChatMessageIfNotExists).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'one',
        userId: BigInt(myTgUserId),
      })
    );
    expect(dbService.createChatMessageIfNotExists).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'two',
        userId: BigInt(otherTgUserId),
      })
    );
    expect(dbService.createChatMessageIfNotExists).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'three',
        userId: BigInt(myTgUserId),
      })
    );
    expect(dbService.createChatMessageIfNotExists).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'four',
        userId: BigInt(otherTgUserId),
      })
    );

    // bot should retrieve messages from db
    const [getChatMessagesChatId, getChatMessagesFromDate] =
      dbService.getChatMessages.mock.calls[0];
    expect(getChatMessagesChatId).toBe(myTgGroupId);
    expect(getChatMessagesFromDate?.getTime()).toBeCloseTo(yesterday().getTime(), -4);

    // bot should send summarization messages
    expect(telegramBotService.sendMessage).toHaveBeenNthCalledWith(
      1,
      myTgGroupId,
      getStartSummarizeMessage()
    );
    expect(telegramBotService.sendMessage).toHaveBeenNthCalledWith(
      2,
      myTgGroupId,
      getEndSummarizeMessage()
    );
  });
});
