import { getEnv } from '../../../config/env.ts';
import { getMaintenanceMessage } from '../../../entryPoints/summarizeBotServer.ts';
import { createTgMessageInGroup, otherTgUser } from '../lib/tgUtils.ts';
import createSummarizeBotServerContext from './createSummarizeBotServerContext.ts';

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
