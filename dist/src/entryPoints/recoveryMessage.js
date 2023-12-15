import { t } from '../config/translations/index.js';
import logger from '../config/logger.js';
const recoveryMessage = async ({ db, telegramBot }) => {
    const chats = await db.getAllChats();
    const results = await Promise.all(chats.map((chat) => trySendMessage(telegramBot, chat)));
    const successCount = results.filter(Boolean).length;
    logger.info(t('recovery.debugInfo', { count: successCount }));
};
export default recoveryMessage;
async function trySendMessage(telegramBotService, chat) {
    try {
        await telegramBotService.sendMessage(Number(chat.id), t('recovery.message'));
        return true;
    }
    catch (error) {
        if (error instanceof Error) {
            logger.error(t('recovery.cantSendMessageError', { message: error.message }));
        }
        return false;
    }
}
