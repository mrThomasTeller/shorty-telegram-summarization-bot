import { encrypt, encryptIfExists } from './encryption.js';
export const convertTgUserToDbUserInput = (user) => ({
    id: user.id,
    firstName: encrypt(user.first_name),
    lastName: encryptIfExists(user.last_name),
    username: encryptIfExists(user.username),
});
export const convertTgMessageToDbMessageInput = (msg, chat, user) => ({
    messageId: msg.message_id,
    chatId: chat.id,
    text: encryptIfExists(msg.text),
    date: new Date(msg.date * 1000),
    userId: user?.id,
});
