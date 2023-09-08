import { getAuthorName, getFormattedMessage } from '../summarizeUtils.js';
import type DbChatMessage from '../types/DbChatMessage.js';

describe('getAuthorName', () => {
  it('should return undefined if author is null', () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const msg = { from: null } as DbChatMessage;

    expect(getAuthorName(msg)).toBeUndefined();
  });

  it('should return first and last name if both are present', () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const msg = {
      from: {
        firstName: 'John',
        lastName: 'Doe',
      },
    } as DbChatMessage;

    expect(getAuthorName(msg)).toBe('John Doe');
  });

  it('should return username if first and last names are not present', () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const msg = {
      from: {
        username: 'johndoe',
      },
    } as DbChatMessage;

    expect(getAuthorName(msg)).toBe('johndoe');
  });

  it('should return undefined if first, last names and username are not present', () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const msg = {
      from: {
        username: null,
      },
    } as DbChatMessage;

    expect(getAuthorName(msg)).toBeUndefined();
  });
});

describe('getFormattedMessage', () => {
  it('should return undefined if author name and text are empty', () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const msg = {
      from: null,
      text: null,
    } as DbChatMessage;

    expect(getFormattedMessage(msg)).toBeUndefined();
  });

  it('should return author name and text if both are present', () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const msg = {
      from: {
        firstName: 'John',
        lastName: 'Doe',
      },
      text: 'Hello',
    } as DbChatMessage;

    expect(getFormattedMessage(msg)).toBe('John Doe: Hello');
  });

  it('should return author name only if text is not presented', () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const msg = {
      from: {
        firstName: 'John',
        lastName: 'Doe',
      },
      text: null,
    } as DbChatMessage;

    expect(getFormattedMessage(msg)).toBe('John Doe: ');
  });

  it('should return only text if author name is not present', () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const msg = {
      from: null,
      text: 'Hello',
    } as DbChatMessage;

    expect(getFormattedMessage(msg)).toBe('Hello');
  });
});
