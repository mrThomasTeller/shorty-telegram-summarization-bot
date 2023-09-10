import '../lib/env.js';
import { getEnv } from '../../config/env.js';
import { getMaintenanceMessage } from '../../entryPoints/summarizeBotServer.js';
import createContext from '../lib/createContext.js';
import { createTgMessageInGroup, otherTgUser } from '../lib/utils.js';

describe('summarizeBotServer common', () => {
  it('respond to messages from non-white chats with maintenance message', async () => {
    const { telegramBotService, simulateChatMessage } = await createContext();

    await simulateChatMessage(
      createTgMessageInGroup({ text: `/ping@${getEnv().BOT_NAME}`, chatId: otherTgUser.id })
    );

    expect(telegramBotService.sendMessage).toHaveBeenCalledWith(
      otherTgUser.id,
      getMaintenanceMessage()
    );
  });
});
