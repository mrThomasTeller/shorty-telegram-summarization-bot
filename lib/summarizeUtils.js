export function getAuthorName(msg) {
  const author = msg.from;
  if (!author) return undefined;

  if (author.first_name) {
    return [author.first_name, author.last_name].filter((x) => !!x).join(' ');
  }

  return author.username;
}

/**
 * @param {import('node-telegram-bot-api').Message} msg
 */
export function getFormattedMessage(msg) {
  const authorName = getAuthorName(msg);
  // const text = '(' + msg.date + ')';
  if (authorName) return `${authorName}: ${msg.text}`;
  return msg.text;
}
