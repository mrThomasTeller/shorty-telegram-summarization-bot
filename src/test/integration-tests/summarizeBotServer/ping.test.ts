import { getPingResponseMessage } from '../../../controllers/commands/pingCommandController.ts';
import { getEnv } from '../../../config/envVars.ts';
import { createTgMessageInGroup, myTgGroupId, myTgUser } from '../lib/tgUtils.ts';
import createSummarizeBotServerContext from './createSummarizeBotServerContext.ts';

describe('summarizeBotServer ping command', () => {
  it('is correct', async () => {
    const { telegramBot, simulateChatMessage } = await createSummarizeBotServerContext();

    await simulateChatMessage(createTgMessageInGroup({ text: `/ping@${getEnv().BOT_NAME}` }));

    expect(telegramBot.sendMessage).toHaveBeenCalledWith(
      myTgGroupId,
      getPingResponseMessage(myTgGroupId, myTgUser.id)
    );
  });
});
