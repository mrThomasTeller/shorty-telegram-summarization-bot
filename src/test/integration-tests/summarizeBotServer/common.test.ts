import { getEnv } from '../../../config/env';
import { getMaintenanceMessage } from '../../../entryPoints/summarizeBotServer';
import { createTgMessageInGroup, otherTgUser } from '../lib/tgUtils';
import createSummarizeBotServerContext from './createSummarizeBotServerContext';

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
