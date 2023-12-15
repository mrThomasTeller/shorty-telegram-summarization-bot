import { getWhiteChatsList, setWhiteChatsList, } from '../../../config/envVars.js';
import { t } from '../../../config/translations/index.js';
import { createTgMessageInGroup, otherTgUser, myTgGroupId, } from '../lib/tgUtils.js';
import createSummarizeBotServerContext from './createSummarizeBotServerContext.js';
import { renderHelpMessage } from '../../../controllers/commands/helpCommandController.js';
import { botName } from '../lib/constants.js';
describe('summarizeBotServer common', () => {
    it('respond to messages from non-white chats with maintenance message', async () => {
        const { telegramBot, simulateChatMessage } = await createSummarizeBotServerContext();
        await simulateChatMessage(createTgMessageInGroup({
            text: `/help@${botName}`,
            chatId: otherTgUser.id,
        }));
        expect(telegramBot.sendMessage).toHaveBeenCalledWith(otherTgUser.id, t('server.maintenanceMessage'));
    });
    it('if there is no whitelist responds to everyone', async () => {
        const oldWhiteList = getWhiteChatsList();
        setWhiteChatsList(undefined);
        const { telegramBot, simulateChatMessage } = await createSummarizeBotServerContext();
        await simulateChatMessage(createTgMessageInGroup({
            text: `/help@${botName}`,
            chatId: otherTgUser.id,
        }));
        expect(telegramBot.sendMessage).toHaveBeenCalledWith(otherTgUser.id, renderHelpMessage(botName), {
            parse_mode: 'MarkdownV2',
        });
        setWhiteChatsList(oldWhiteList);
    });
    it('shows help when added to new chat', async () => {
        const { telegramBot, simulateAddedToChat } = await createSummarizeBotServerContext();
        await simulateAddedToChat(myTgGroupId);
        expect(telegramBot.sendMessage).toHaveBeenCalledWith(myTgGroupId, renderHelpMessage(botName), {
            parse_mode: 'MarkdownV2',
        });
    });
});
