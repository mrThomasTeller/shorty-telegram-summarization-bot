import type DbService from '../services/DbService';
import type TelegramBotService from '../services/TelegramBotService';

// todo test
export default async function printNews(
  db: DbService,
  telegramBot: TelegramBotService,
  chatId: number
): Promise<void> {
  const { chat } = await db.getOrCreateChat(chatId);
  if ((chat.news ?? '').trim() !== '') {
    await telegramBot.sendMessage(chatId, chat.news ?? '', { parse_mode: 'MarkdownV2' });
  }
  await db.resetChatNews(chatId);
}
