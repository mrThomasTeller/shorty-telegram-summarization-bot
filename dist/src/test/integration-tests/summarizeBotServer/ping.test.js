import { getPingResponseMessage } from '../../../controllers/commands/pingCommandController.js';
import { createTgMessageInGroup, myTgGroupId, myTgUser, } from '../lib/tgUtils.js';
import createSummarizeBotServerContext from './createSummarizeBotServerContext.js';
import { botName } from '../lib/constants.js';
describe('summarizeBotServer ping command', () => {
    it('is correct', async () => {
        const { telegramBot, simulateChatMessage } = await createSummarizeBotServerContext();
        await simulateChatMessage(createTgMessageInGroup({ text: `/ping@${botName}` }));
        expect(telegramBot.sendMessage).toHaveBeenCalledWith(myTgGroupId, getPingResponseMessage(myTgGroupId, myTgUser.id));
    });
});
