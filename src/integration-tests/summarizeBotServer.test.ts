import { getPingResponseMessage } from '../commands/ping.js';
import {
  createDbMessageInGroup,
  createTgMessageInGroup,
  myTgGroupId,
  myTgUserId,
  otherTgUserId,
} from './lib/utils.js';
import { getMaintenanceMessage } from '../entryPoints/summarizeBotServer.js';
import { getEnv, setWhiteChatsList } from '../config/env.js';
import createContext from './lib/createContext.js';
import { yesterday, yesterdayBeforeYesterday, required } from '../lib/utils.js';
import { getEndSummarizeMessage, getStartSummarizeMessage } from '../commands/summarize.js';

describe('summarizeBotServer', () => {
  beforeAll(() => {
    setWhiteChatsList([myTgUserId, myTgGroupId]);
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

  it('/summarize command is correct', async () => {
    const { telegramBotService, dbService, simulateChatMessage } = await createContext();

    const tgMessages = [
      createTgMessageInGroup({ text: `one`, userId: myTgUserId, date: yesterdayBeforeYesterday() }),
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

    // bot should retrieve messages from db
    const [getChatMessagesChatId, getChatMessagesFromDate] =
      dbService.getChatMessages.mock.calls[0];
    expect(getChatMessagesChatId).toBe(myTgGroupId);
    expect(getChatMessagesFromDate?.getTime()).toBeCloseTo(yesterday().getTime() / 1000, -1);

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
