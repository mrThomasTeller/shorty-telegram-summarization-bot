import _ from 'lodash';
import { decryptIfExists } from './encryption.js';
export function getAuthorName(msg) {
    const author = msg.from;
    if (author === null)
        return undefined;
    const firstName = decryptIfExists(author.firstName);
    const lastName = decryptIfExists(author.lastName);
    const username = decryptIfExists(author.username);
    if (firstName != null) {
        return [firstName, lastName].filter(_.negate(_.isEmpty)).join(' ');
    }
    return username ?? undefined;
}
export function getFormattedMessage(msg) {
    const authorName = getAuthorName(msg);
    const text = decryptIfExists(msg.text);
    if (!_.isEmpty(authorName))
        return `${authorName}: ${text ?? ''}`;
    return text ?? undefined;
}
