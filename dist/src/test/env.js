import '../env.js';
import { setEnv, setWhiteChatsList } from '../config/envVars.js';
import { myTgGroup2Id, myTgGroupId, myTgUser, } from './integration-tests/lib/tgUtils.js';
import logger from '../config/logger.js';
beforeAll(() => {
    setWhiteChatsList([myTgUser.id, myTgGroupId, myTgGroup2Id]);
    setEnv({ RETRY_GPT_QUERY_TIME: 10 });
});
beforeEach(() => {
    logger.log = jest.fn().mockReturnValue(logger);
    logger.info = jest.fn().mockReturnValue(logger);
    logger.warn = jest.fn().mockReturnValue(logger);
    logger.error = jest.fn().mockReturnValue(logger);
});
export const loggerMock = logger;
