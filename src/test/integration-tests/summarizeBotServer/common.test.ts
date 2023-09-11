import { getEnv } from '../../../config/env.ts';
import { t } from '../../../config/translations/index.ts';
import { createTgMessageInGroup, otherTgUser } from '../lib/tgUtils.ts';
import createSummarizeBotServerContext from './createSummarizeBotServerContext.ts';

describe('summarizeBotServer common', () => {
  it('respond to messages from non-white chats with maintenance message', async () => {
    const { telegramBot, simulateChatMessage } = await createSummarizeBotServerContext();

    await simulateChatMessage(
      createTgMessageInGroup({ text: `/summarize@${getEnv().BOT_NAME}`, chatId: otherTgUser.id })
    );

    expect(telegramBot.sendMessage).toHaveBeenCalledWith(
      otherTgUser.id,
      t('server.maintenanceMessage')
    );
  });
});
