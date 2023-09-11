import { t } from '../config/translations/index.ts';
import type EntryPoint from './EntryPoint.ts';
import type TelegramBotService from '../services/TelegramBotService';
import { type Chat } from '@prisma/client';

const recoveryMessage: EntryPoint = async ({ db, telegramBot }) => {
  const chats = await db.getAllChats();

  const results = await Promise.all(chats.map((chat) => trySendMessage(telegramBot, chat)));
  const successCount = results.filter(Boolean).length;

  console.info(t('recovery.debugInfo', { count: successCount }));
};

export default recoveryMessage;

async function trySendMessage(
  telegramBotService: TelegramBotService,
  chat: Chat
): Promise<boolean> {
  try {
    await telegramBotService.sendMessage(Number(chat.id), t('recovery.message'));
    return true;
  } catch (error) {
    if (error instanceof Error) {
      console.error(t('recovery.cantSendMessageError', { message: error.message }));
    }
    return false;
  }
}
