import { getEnv } from '../../../config/env.js';
import { getMaintenanceMessage } from '../../../entryPoints/summarizeBotServer.js';
import { createTgMessageInGroup, otherTgUser } from '../lib/tgUtils.js';
import createSummarizeBotServerContext from './createSummarizeBotServerContext.js';

describe('summarizeBotServer common', () => {
  it('respond to messages from non-white chats with maintenance message', async () => {
    const { telegramBotService, simulateChatMessage } = await createSummarizeBotServerContext();

    await simulateChatMessage(
      createTgMessageInGroup({ text: `/ping@${getEnv().BOT_NAME}`, chatId: otherTgUser.id })
    );

    expect(telegramBotService.sendMessage).toHaveBeenCalledWith(
      otherTgUser.id,
      getMaintenanceMessage()
    );
  });
});
