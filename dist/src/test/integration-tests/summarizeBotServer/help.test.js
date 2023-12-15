import { createTgMessageInGroup, myTgGroupId } from '../lib/tgUtils.js';
import createSummarizeBotServerContext from './createSummarizeBotServerContext.js';
import { renderHelpMessage } from '../../../controllers/commands/helpCommandController.js';
import { botName } from '../lib/constants.js';
describe('summarizeBotServer help command', () => {
    it('is correct', async () => {
        const { telegramBot, simulateChatMessage } = await createSummarizeBotServerContext();
        await simulateChatMessage(createTgMessageInGroup({ text: `/help@${botName}` }));
        expect(telegramBot.sendMessage).toHaveBeenCalledWith(myTgGroupId, renderHelpMessage(botName), {
            parse_mode: 'MarkdownV2',
        });
    });
});
