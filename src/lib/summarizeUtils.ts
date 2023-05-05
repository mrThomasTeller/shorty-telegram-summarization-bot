import _ from 'lodash';
import type ChatMessage from './types/ChatMessage.ts';

export function getAuthorName(msg: ChatMessage): string | undefined {
  const author = msg.from;
  if (author === undefined) return undefined;

  if (author.first_name !== undefined) {
    return [author.first_name, author.last_name].filter(_.negate(_.isEmpty)).join(' ');
  }

  return author.username;
}
export function getFormattedMessage(msg: ChatMessage): string | undefined {
  const authorName = getAuthorName(msg);
  // const text = '(' + msg.date + ')';
  if (!_.isEmpty(authorName)) return `${authorName as string}: ${msg.text ?? ''}`;
  return msg.text;
}
