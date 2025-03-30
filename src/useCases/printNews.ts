import type TelegramBot from 'node-telegram-bot-api';
import { encryptIfExists } from '../data/encryption';
import type DbService from '../services/DbService';
import type TelegramBotService from '../services/TelegramBotService';

// todo test
export default async function printNews(
  db: DbService,
  telegramBot: TelegramBotService,
  tgChat: TelegramBot.Chat
): Promise<boolean> {
  const { chat } = await db.upsertChat(tgChat.id, encryptIfExists(tgChat.title));
  if ((chat.news ?? '').trim() === '') return false;

  await telegramBot.sendMessage(tgChat.id, chat.news ?? '', { parse_mode: 'MarkdownV2' });
  await db.updateChat(tgChat.id, { news: null, title: encryptIfExists(tgChat.title) });
  return true;
}
