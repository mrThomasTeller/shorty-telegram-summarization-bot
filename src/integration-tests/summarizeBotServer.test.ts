import { setTimeout } from 'timers/promises';
import { getPingResponseMessage } from '../commands/ping.js';
import {
  createContext,
  createMessageInGroup,
  myTgGroupId,
  myTgUserId,
  otherTgUserId,
} from './utils.js';
import { getMaintenanceMessage } from '../entryPoints/summarizeBotServer.js';
import { getEnv, setWhiteChatsList } from '../config/env.js';

describe('summarizeBotServer', () => {
  beforeAll(() => {
    setWhiteChatsList([myTgUserId, myTgGroupId]);
  });

  it('respond to messages from non-white chats with maintenance message', async () => {
    const { telegramBotService, run } = createContext();

    telegramBotService.onAnyMessage.mockImplementation(async (callback) => {
      await callback(createMessageInGroup(`/ping@${getEnv().BOT_NAME}`, otherTgUserId));
    });

    void run();

    await setTimeout(0);
    expect(telegramBotService.sendMessage).toHaveBeenCalledWith(
      otherTgUserId,
      getMaintenanceMessage()
    );
  });

  it('/ping command is correct', async () => {
    const { telegramBotService, run } = createContext();

    telegramBotService.onAnyMessage.mockImplementation(async (callback) => {
      await callback(createMessageInGroup(`/ping@${getEnv().BOT_NAME}`, myTgUserId));
    });

    void run();

    await setTimeout(0);
    expect(telegramBotService.sendMessage).toHaveBeenCalledWith(
      myTgUserId,
      getPingResponseMessage()
    );
  });
});
