import { getEnv } from '../../../config/env.ts';
import { consoleMock } from '../../env.ts';
import { createTgMessageInGroup } from '../lib/tgUtils.ts';
import { getLogMessage } from '../../../entryPoints/summarizeBotServer.ts';
import createSummarizeBotServerContext from './createSummarizeBotServerContext.ts';

describe('summarizeBotServer log command', () => {
  it('is correct', async () => {
    const { simulateChatMessage } = await createSummarizeBotServerContext();

    const msg = await simulateChatMessage(
      createTgMessageInGroup({ text: `/log@${getEnv().BOT_NAME}` })
    );

    expect(consoleMock.info).toHaveBeenCalledWith(getLogMessage(msg));
  });
});
