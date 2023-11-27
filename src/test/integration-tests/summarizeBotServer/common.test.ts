import { t } from '../../../config/translations/index.ts';
import { createTgMessageInGroup, otherTgUser, myTgGroupId } from '../lib/tgUtils.ts';
import createSummarizeBotServerContext from './createSummarizeBotServerContext.ts';
import { renderHelpMessage } from '../../../controllers/commands/helpCommandController.ts';
import { botName } from '../lib/constants.ts';

describe('summarizeBotServer common', () => {
  it('respond to messages from non-white chats with maintenance message', async () => {
    const { telegramBot, simulateChatMessage } = await createSummarizeBotServerContext();

    await simulateChatMessage(
      createTgMessageInGroup({ text: `/summarize@${botName}`, chatId: otherTgUser.id })
    );

    expect(telegramBot.sendMessage).toHaveBeenCalledWith(
      otherTgUser.id,
      t('server.maintenanceMessage')
    );
  });

  it('shows help when added to new chat', async () => {
    const { telegramBot, simulateAddedToChat } = await createSummarizeBotServerContext();

    simulateAddedToChat(myTgGroupId);

    expect(telegramBot.sendMessage).toHaveBeenCalledWith(myTgGroupId, renderHelpMessage(botName), {
      parse_mode: 'MarkdownV2',
    });
  });
});
