import { getPingResponseMessage } from '../../../commands/ping.js';
import { getEnv } from '../../../config/env.js';
import { createTgMessageInGroup, myTgGroupId } from '../lib/tgUtils.js';
import createSummarizeBotServerContext from './createSummarizeBotServerContext.js';

describe('summarizeBotServer ping command', () => {
  it('is correct', async () => {
    const { telegramBotService, simulateChatMessage } = await createSummarizeBotServerContext();

    await simulateChatMessage(createTgMessageInGroup({ text: `/ping@${getEnv().BOT_NAME}` }));

    expect(telegramBotService.sendMessage).toHaveBeenCalledWith(
      myTgGroupId,
      getPingResponseMessage()
    );
  });
});
