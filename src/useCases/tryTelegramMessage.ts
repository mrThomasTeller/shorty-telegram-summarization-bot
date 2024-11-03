import type TelegramBotService from '../services/TelegramBotService';

export default async function tryTelegramMessage(
  chatId: number,
  telegramBot: TelegramBotService,
  message: string
): Promise<void> {
  try {
    await telegramBot.sendMessage(chatId, message, {
      parse_mode: 'MarkdownV2',
    });
  } catch (error) {
    if (error != null && error instanceof Error) {
      await telegramBot.sendMessage(chatId, error.message);
    }
    throw error;
  }
}
