import { type _MockProxy } from 'jest-mock-extended/lib/Mock.js';
import { setEnv, setWhiteChatsList } from '../../config/env.js';
import { myTgGroupId, myTgUser } from './utils.js';
import mockConsole from 'jest-mock-console';

beforeAll(() => {
  setWhiteChatsList([myTgUser.id, myTgGroupId]);
  setEnv({ RETRY_GPT_QUERY_TIME: 10 });
  mockConsole(['info', 'warn', 'error']);
});

beforeEach(() => {
  jest.clearAllMocks();
});

export const consoleMock = console as _MockProxy<Console> & Console;
