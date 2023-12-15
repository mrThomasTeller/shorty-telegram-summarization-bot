import _ from 'lodash';
import type DbChatMessage from './DbChatMessage.js';
import { decryptIfExists } from './encryption.js';

export function getAuthorName(msg: DbChatMessage): string | undefined {
  const author = msg.from;
  if (author === null) return undefined;

  const firstName = decryptIfExists(author.firstName);
  const lastName = decryptIfExists(author.lastName);
  const username = decryptIfExists(author.username);

  if (firstName != null) {
    return [firstName, lastName].filter(_.negate(_.isEmpty)).join(' ');
  }

  return username ?? undefined;
}

export function getFormattedMessage(msg: DbChatMessage): string | undefined {
  const authorName = getAuthorName(msg);
  const text = decryptIfExists(msg.text);
  if (!_.isEmpty(authorName)) return `${authorName as string}: ${text ?? ''}`;
  return text ?? undefined;
}
