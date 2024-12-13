import * as R from 'remeda';
import { type Api } from 'telegram';
import { expect } from 'bun:test';

export function expectTgMessagesSnapshot(messages: Api.Message[]): void {
  expect(messages.map((message) => R.pick(message, ['message']))).toMatchSnapshot();
}
