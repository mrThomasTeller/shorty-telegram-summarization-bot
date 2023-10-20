import { getEnv } from '../../../config/envVars.ts';
import { createTgMessageInGroup, myTgGroupId } from '../lib/tgUtils.ts';
import createSummarizeBotServerContext from './createSummarizeBotServerContext.ts';
import { renderHelpMessage } from '../../../controllers/commands/helpCommandController.ts';

describe('summarizeBotServer help command', () => {
  it('is correct', async () => {
    const { telegramBot, simulateChatMessage } = await createSummarizeBotServerContext();

    await simulateChatMessage(createTgMessageInGroup({ text: `/help@${getEnv().BOT_NAME}` }));

    expect(telegramBot.sendMessage).toHaveBeenCalledWith(myTgGroupId, renderHelpMessage(), {
      parse_mode: 'MarkdownV2',
    });
  });
});
