import { getFormattedMessage } from '../../../data/dbChatMessageUtils.js';
import { required } from '../../../lib/common.js';
import { t } from '../../../config/translations/index.js';
import { now } from 'lodash';
import { myTgGroupId } from './tgUtils.js';
import { decryptIfExists } from '../../../data/encryption.js';
export function expectBotCreatedUsers(db, users) {
    for (const user of users) {
        const userFound = db.users.some((dbUser) => dbUser.id === BigInt(user.id) &&
            decryptIfExists(dbUser.username) === user.username &&
            decryptIfExists(dbUser.firstName) === user.first_name &&
            decryptIfExists(dbUser.lastName) === user.last_name);
        expect(userFound).toBe(true);
    }
}
export function expectBotCreatedDbChatMessages(db, messages) {
    for (const message of messages) {
        const messageFound = db.messages.some((dbMessage) => decryptIfExists(dbMessage.text) === message.text &&
            dbMessage.userId === BigInt(required(message.from?.id)));
        expect(messageFound).toBe(true);
    }
}
export function expectBotQueriedSummaryFromGpt(gpt, summaryPartPointsCount, messagesBunches) {
    for (const [index, messages] of messagesBunches.entries()) {
        const call = required(gpt.sendMessage.mock.calls[index]);
        expect(call[0]).toBe(t(summaryPartPointsCount === 1
            ? 'summarize.gptQuery'
            : 'summarize.gptQueryWithPoints', {
            pointsCount: summaryPartPointsCount,
            text: messages
                .map((message) => getFormattedMessage(message))
                .join('\n'),
        }));
        expect(call[1]).toEqual(expect.objectContaining({
            completionParams: { max_tokens: 2048 },
        }));
    }
    expect(gpt.sendMessage).toHaveBeenCalledTimes(messagesBunches.length);
}
export function expectBotSentExactMessagesToTg(telegramBot, messages, userId = myTgGroupId) {
    for (const [index, message] of messages.entries()) {
        const [messageText, messageUserId] = Array.isArray(message)
            ? message
            : [message, userId];
        expect(telegramBot.sendMessage).toHaveBeenNthCalledWith(index + 1, messageUserId, messageText);
    }
    expect(telegramBot.sendMessage).toHaveBeenCalledTimes(messages.length);
}
export function expectBotAddedSummariesToDb(db, chatId, gptTestSummariesCount) {
    expect(db.createSummary).toHaveBeenCalledTimes(gptTestSummariesCount);
    for (const call of db.createSummary.mock.calls) {
        expect(call[0]).toBe(chatId);
        expect(call[1].getTime()).toBeCloseTo(now(), -4); // 10 seconds
    }
}
