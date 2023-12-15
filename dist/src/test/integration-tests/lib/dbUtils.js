import { myTgGroupId, myTgUser } from './tgUtils.js';
import { encrypt, encryptIfExists } from '../../../data/encryption.js';
export function createDbMessageInGroup({ text, messageId, chatId = myTgGroupId, user = myTgUser, date = new Date(), }) {
    return {
        messageId: BigInt(messageId),
        text: encrypt(text),
        date,
        userId: BigInt(user.id),
        chatId: BigInt(chatId),
        from: {
            id: BigInt(user.id),
            firstName: encrypt(user.first_name),
            lastName: encryptIfExists(user.last_name) ?? null,
            username: encryptIfExists(user.username) ?? null,
        },
    };
}
export const mapTgMessagesToDbMessages = (tgMessages) => {
    const messagesData = tgMessages.map((tgMessage) => ({
        message: createDbMessageInGroup({
            text: tgMessage.text ?? '',
            messageId: tgMessage.message_id,
            date: new Date(tgMessage.date * 1000),
            user: tgMessage.from,
            chatId: tgMessage.chat.id,
        }),
        shouldBeSkipped: Boolean(tgMessage.shouldBeSkipped),
    }));
    return {
        all: messagesData.map((d) => d.message),
        actual: messagesData
            .filter((d) => !d.shouldBeSkipped)
            .map((d) => d.message),
    };
};
