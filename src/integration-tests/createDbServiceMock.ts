import { type _MockProxy } from 'jest-mock-extended/lib/Mock.js';
import type DbService from '../services/DbService.js';
import { mock } from 'jest-mock-extended';

export type DbServiceMock = DbService & _MockProxy<DbService>;

export default function createDbServiceMock(): DbServiceMock {
  const service = mock<DbService>();

  return service;
}
