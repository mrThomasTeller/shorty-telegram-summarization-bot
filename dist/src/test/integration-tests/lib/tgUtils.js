import { required } from '../../../lib/common.js';
import _ from 'lodash';
import formatDate from 'date-fns/format';
import { botName, tgMessageLength } from './constants.js';
export const myTgUser = {
    id: 111,
    is_bot: false,
    first_name: 'Артём',
    last_name: 'Бахарев',
    username: 'mrThomasTeller',
    language_code: 'en',
};
export const myFullName = `${myTgUser.first_name} ${required(myTgUser.last_name)}`;
export const otherTgUser = {
    id: 333,
    is_bot: false,
    first_name: 'Иван',
    last_name: 'Иванович',
    username: 'vanya',
    language_code: 'en',
};
export const otherFullName = `${otherTgUser.first_name} ${required(otherTgUser.last_name)}`;
export const myTgGroupId = 222;
export const myTgGroup2Id = 223;
export const otherTgGroupId = 444;
let messageId = 0;
export function createTgMessageInGroup({ text, chatId = myTgGroupId, user = myTgUser, date = new Date(), shouldBeSkipped = false, }) {
    return {
        message_id: ++messageId,
        from: user,
        chat: {
            id: chatId,
            title: 'Test Summarize Bot dev',
            type: 'supergroup',
        },
        date: date.getTime() / 1000,
        text,
        shouldBeSkipped,
    };
}
export const createSummarizeCommandMessage = (user, chatId = myTgGroupId) => createTgMessageInGroup({ text: `/summarize@${botName}`, user, chatId });
export function createTgMessages(currentCountOrBunches, chatId = myTgGroupId) {
    if (typeof currentCountOrBunches === 'number') {
        return createTgMessages([{ date: new Date(), count: currentCountOrBunches }], chatId);
    }
    const tgMessagesDates = currentCountOrBunches.flatMap((bunch) => _.range(bunch.count).map(() => ({
        date: bunch.date,
        shouldBeSkipped: bunch.shouldBeSkipped,
    })));
    return tgMessagesDates.map(({ date, shouldBeSkipped }, num) => createTgMessageInGroup({
        text: createSampleText(num, date),
        user: num % 2 === 0 ? myTgUser : otherTgUser,
        date,
        shouldBeSkipped,
        chatId,
    }));
}
function createSampleText(num, date) {
    const prefix = `Message: ${num}. Date: ${formatDate(date, 'dd.mm.yyyy HH:mm')}. Text: `;
    return `${prefix}${'a'.repeat(tgMessageLength - prefix.length)}`;
}
