import { getPingResponseMessage } from '../../../controllers/commands/pingCommandController';
import { createTgMessageInGroup, myTgGroupId, myTgUser } from '../lib/tgUtils';
import createSummarizeBotServerContext from './createSummarizeBotServerContext';
import { botName } from '../lib/constants';

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
