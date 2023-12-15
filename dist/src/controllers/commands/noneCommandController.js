import { rejectAsync } from '../../lib/rxOperators.js';
import { catchError } from '../../lib/async.js';
import { convertTgMessageToDbMessageInput, convertTgUserToDbUserInput, } from '../../data/convertors.js';
import logger from '../../config/logger.js';
const noneCommandController = ({ chat$, chatId, services }) => {
    chat$
        .pipe(rejectAsync((msg) => services.db.hasMessage(msg.message_id, chatId)))
        .subscribe((msg) => {
        catchError(addMessageToDb(msg, services.db));
    });
};
export default noneCommandController;
async function addMessageToDb(msg, db) {
    const userCreationResult = msg.from &&
        (await db.getOrCreateUser(convertTgUserToDbUserInput(msg.from)));
    const user = userCreationResult?.[0];
    const [chat, created] = await db.getOrCreateChat(msg.chat.id);
    if (created) {
        logger.info(`New chat created: ${msg.chat.id}`);
    }
    await db.createChatMessageIfNotExists(convertTgMessageToDbMessageInput(msg, chat, user));
}
