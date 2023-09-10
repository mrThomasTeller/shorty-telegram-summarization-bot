import { consoleMock } from '../lib/env.js';
import { getEnv } from '../../config/env.js';
import createContext from '../lib/createContext.js';
import { createTgMessageInGroup } from '../lib/utils.js';
import { getLogMessage } from '../../entryPoints/summarizeBotServer.js';

describe('summarizeBotServer log command', () => {
  it('is correct', async () => {
    const { simulateChatMessage } = await createContext();

    const msg = await simulateChatMessage(
      createTgMessageInGroup({ text: `/log@${getEnv().BOT_NAME}` })
    );

    expect(consoleMock.info).toHaveBeenCalledWith(getLogMessage(msg));
  });
});
