import { getPingResponseMessage } from '../../../controllers/commands/pingCommandController.ts';
import { createTgMessageInGroup, myTgGroupId, myTgUser } from '../lib/tgUtils.ts';
import createSummarizeBotServerContext from './createSummarizeBotServerContext.ts';
import { botName } from '../lib/constants.ts';

describe('summarizeBotServer ping command', () => {
  it('is correct', async () => {
    const { telegramBot, simulateChatMessage } = await createSummarizeBotServerContext();

    await simulateChatMessage(createTgMessageInGroup({ text: `/ping@${botName}` }));

    expect(telegramBot.sendMessage).toHaveBeenCalledWith(
      myTgGroupId,
      getPingResponseMessage(myTgGroupId, myTgUser.id)
    );
  });
});
