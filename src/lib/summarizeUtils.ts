import _ from 'lodash';
import type ChatMessage from './types/ChatMessage';

export function getAuthorName(msg: ChatMessage): string | undefined {
  const author = msg.from;
  if (author === null) return undefined;

  if (author.firstName !== undefined) {
    return [author.firstName, author.lastName].filter(_.negate(_.isEmpty)).join(' ');
  }

  return author.username ?? undefined;
}
export function getFormattedMessage(msg: ChatMessage): string | undefined {
  const authorName = getAuthorName(msg);
  // const text = '(' + msg.date + ')';
  if (!_.isEmpty(authorName)) return `${authorName as string}: ${msg.text ?? ''}`;
  return msg.text ?? undefined;
}
