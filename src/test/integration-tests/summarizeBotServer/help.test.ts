import { createTgMessageInGroup, myTgGroupId } from '../lib/tgUtils';
import createSummarizeBotServerContext from './createSummarizeBotServerContext';
import { renderHelpMessage } from '../../../controllers/commands/helpCommandController';
import { botName } from '../lib/constants';

describe('summarizeBotServer help command', () => {
  it('is correct', async () => {
    const { telegramBot, simulateChatMessage } = await createSummarizeBotServerContext();

    await simulateChatMessage(createTgMessageInGroup({ text: `/help@${botName}` }));

    expect(telegramBot.sendMessage).toHaveBeenCalledWith(myTgGroupId, renderHelpMessage(botName), {
      parse_mode: 'MarkdownV2',
    });
  });
});
