import '../env.ts';
import { type _MockProxy } from 'jest-mock-extended/lib/Mock';
import { setEnv, setWhiteChatsList } from '../config/envVars.ts';
import { myTgGroupId, myTgUser } from './integration-tests/lib/tgUtils.ts';
import logger from '../config/logger.ts';
import { type Logger } from 'winston';

beforeAll(() => {
  setWhiteChatsList([myTgUser.id, myTgGroupId]);
  setEnv({ RETRY_GPT_QUERY_TIME: 10 });
});

beforeEach(() => {
  jest.spyOn(logger, 'log').mockImplementation(() => logger);
  jest.spyOn(logger, 'info').mockImplementation(() => logger);
  jest.spyOn(logger, 'warn').mockImplementation(() => logger);
  jest.spyOn(logger, 'error').mockImplementation(() => logger);
});

export const loggerMock = logger as _MockProxy<Logger> & Logger;
