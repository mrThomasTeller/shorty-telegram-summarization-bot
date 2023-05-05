import _ from 'lodash';
export function getAuthorName(msg) {
    const author = msg.from;
    if (author === null)
        return undefined;
    if (author.firstName !== undefined) {
        return [author.firstName, author.lastName].filter(_.negate(_.isEmpty)).join(' ');
    }
    return author.username ?? undefined;
}
export function getFormattedMessage(msg) {
    const authorName = getAuthorName(msg);
    // const text = '(' + msg.date + ')';
    if (!_.isEmpty(authorName))
        return `${authorName}: ${msg.text ?? ''}`;
    return msg.text ?? undefined;
}
