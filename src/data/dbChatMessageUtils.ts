import _ from 'lodash';
import type DbChatMessage from './DbChatMessage.ts';

export function getAuthorName(msg: DbChatMessage): string | undefined {
  const author = msg.from;
  if (author === null) return undefined;

  if (author.firstName != null) {
    return [author.firstName, author.lastName].filter(_.negate(_.isEmpty)).join(' ');
  }

  return author.username ?? undefined;
}

export function getFormattedMessage(msg: DbChatMessage): string | undefined {
  const authorName = getAuthorName(msg);
  // const text = '(' + msg.date + ')';
  if (!_.isEmpty(authorName)) return `${authorName as string}: ${msg.text ?? ''}`;
  return msg.text ?? undefined;
}
