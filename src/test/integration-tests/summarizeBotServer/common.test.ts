import { getEnv, getWhiteChatsList, setWhiteChatsList } from '../../../config/envVars.ts';
import { t } from '../../../config/translations/index.ts';
import { createTgMessageInGroup, otherTgUser, myTgGroupId } from '../lib/tgUtils.ts';
import createSummarizeBotServerContext from './createSummarizeBotServerContext.ts';
import { renderHelpMessage } from '../../../controllers/commands/helpCommandController.ts';

describe('summarizeBotServer common', () => {
  it('respond to messages from non-white chats with maintenance message', async () => {
    const { telegramBot, simulateChatMessage } = await createSummarizeBotServerContext();

    await simulateChatMessage(
      createTgMessageInGroup({ text: `/help@${getEnv().BOT_NAME}`, chatId: otherTgUser.id })
    );

    expect(telegramBot.sendMessage).toHaveBeenCalledWith(
      otherTgUser.id,
      t('server.maintenanceMessage')
    );
  });

  it('if there is no whitelist responds to everyone', async () => {
    const oldWhiteList = getWhiteChatsList();
    setWhiteChatsList(undefined);

    const { telegramBot, simulateChatMessage } = await createSummarizeBotServerContext();

    await simulateChatMessage(
      createTgMessageInGroup({ text: `/help@${getEnv().BOT_NAME}`, chatId: otherTgUser.id })
    );

    expect(telegramBot.sendMessage).toHaveBeenCalledWith(otherTgUser.id, renderHelpMessage(), {
      parse_mode: 'MarkdownV2',
    });

    setWhiteChatsList(oldWhiteList);
  });

  it('shows help when added to new chat', async () => {
    const { telegramBot, simulateAddedToChat } = await createSummarizeBotServerContext();

    simulateAddedToChat(myTgGroupId);

    expect(telegramBot.sendMessage).toHaveBeenCalledWith(myTgGroupId, renderHelpMessage(), {
      parse_mode: 'MarkdownV2',
    });
  });
});
