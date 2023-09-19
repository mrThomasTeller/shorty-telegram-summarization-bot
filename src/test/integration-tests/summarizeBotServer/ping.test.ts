import { getPingResponseMessage } from '../../../commands/ping';
import { getEnv } from '../../../config/env';
import { createTgMessageInGroup, myTgGroupId } from '../lib/tgUtils';
import createSummarizeBotServerContext from './createSummarizeBotServerContext.ts';

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
