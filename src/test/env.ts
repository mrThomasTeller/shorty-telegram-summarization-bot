import '../env.ts';
import { type _MockProxy } from 'jest-mock-extended/lib/Mock';
import { setEnv, setWhiteChatsList } from '../config/envVars.ts';
import { myTgGroup2Id, myTgGroupId, myTgUser } from './integration-tests/lib/tgUtils.ts';
import logger from '../config/logger.ts';
import { type Logger } from 'winston';

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

export const loggerMock = logger as _MockProxy<Logger> & Logger;
