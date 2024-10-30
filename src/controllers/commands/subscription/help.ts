import type TelegramBot from 'node-telegram-bot-api';
import { getEnv } from '../../../config/envVars';
import type TelegramBotService from '../../../services/TelegramBotService';
import { makeHelpUrl } from './routing';

export const helpKeyboardButton = (botName: string): TelegramBot.InlineKeyboardButton[] => [
  {
    text: '❓ Мне нужна помощь',
    url: makeHelpUrl({ botName }),
  },
];

export const helpKeyboard = (
  botName: string
): Pick<TelegramBot.SendMessageOptions, 'parse_mode' | 'reply_markup'> => ({
  reply_markup: {
    inline_keyboard: [helpKeyboardButton(botName)],
  },
});

export const help = async (telegramBot: TelegramBotService, chatId: number): Promise<void> => {
  await telegramBot.sendMessage(
    chatId,
    `🤗 Если вам нужна помощь, пожалуйста, обратитесь в поддержку: @${getEnv().SUPPORT_BOT_NAME}`
  );
};
