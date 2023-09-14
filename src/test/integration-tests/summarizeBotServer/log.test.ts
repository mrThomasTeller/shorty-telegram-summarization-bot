import { getEnv } from '../../../config/env';
import { consoleMock } from '../../env';
import { createTgMessageInGroup } from '../lib/tgUtils';
import { getLogMessage } from '../../../entryPoints/summarizeBotServer';
import createSummarizeBotServerContext from './createSummarizeBotServerContext';

describe('summarizeBotServer log command', () => {
  it('is correct', async () => {
    const { simulateChatMessage } = await createSummarizeBotServerContext();

    const msg = await simulateChatMessage(
      createTgMessageInGroup({ text: `/log@${getEnv().BOT_NAME}` })
    );

    expect(consoleMock.info).toHaveBeenCalledWith(getLogMessage(msg));
  });
});
