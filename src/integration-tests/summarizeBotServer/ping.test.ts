import '../lib/env.js';
import { getPingResponseMessage } from '../../commands/ping.js';
import { getEnv } from '../../config/env.js';
import createContext from '../lib/createContext.js';
import { createTgMessageInGroup, myTgGroupId } from '../lib/utils.js';

describe('summarizeBotServer ping command', () => {
  it('is correct', async () => {
    const { telegramBotService, simulateChatMessage } = await createContext();

    await simulateChatMessage(createTgMessageInGroup({ text: `/ping@${getEnv().BOT_NAME}` }));

    expect(telegramBotService.sendMessage).toHaveBeenCalledWith(
      myTgGroupId,
      getPingResponseMessage()
    );
  });
});
