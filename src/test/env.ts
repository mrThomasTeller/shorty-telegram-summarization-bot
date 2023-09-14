import { type _MockProxy } from 'jest-mock-extended/lib/Mock';
import { setEnv, setWhiteChatsList } from '../config/env';
import { myTgGroupId, myTgUser } from './integration-tests/lib/tgUtils';
import mockConsole from 'jest-mock-console';

beforeAll(() => {
  setWhiteChatsList([myTgUser.id, myTgGroupId]);
  setEnv({ RETRY_GPT_QUERY_TIME: 10 });
  mockConsole(['info', 'warn', 'error']);
});

export const consoleMock = console as _MockProxy<Console> & Console;
