import { getEnv } from '../../../config/env.js';
import { consoleMock } from '../../env.js';
import { createTgMessageInGroup } from '../lib/tgUtils.js';
import { getLogMessage } from '../../../entryPoints/summarizeBotServer.js';
import createSummarizeBotServerContext from './createSummarizeBotServerContext.js';

describe('summarizeBotServer log command', () => {
  it('is correct', async () => {
    const { simulateChatMessage } = await createSummarizeBotServerContext();

    const msg = await simulateChatMessage(
      createTgMessageInGroup({ text: `/log@${getEnv().BOT_NAME}` })
    );

    expect(consoleMock.info).toHaveBeenCalledWith(getLogMessage(msg));
  });
});
