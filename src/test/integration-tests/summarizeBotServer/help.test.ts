import { createTgMessageInGroup, myTgGroupId } from '../lib/tgUtils.ts';
import createSummarizeBotServerContext from './createSummarizeBotServerContext.ts';
import { renderHelpMessage } from '../../../controllers/commands/helpCommandController.ts';
import { botName } from '../lib/constants.ts';

describe('summarizeBotServer help command', () => {
  it('is correct', async () => {
    const { telegramBot, simulateChatMessage } = await createSummarizeBotServerContext();

    await simulateChatMessage(createTgMessageInGroup({ text: `/help@${botName}` }));

    expect(telegramBot.sendMessage).toHaveBeenCalledWith(myTgGroupId, renderHelpMessage(botName), {
      parse_mode: 'MarkdownV2',
    });
  });
});
