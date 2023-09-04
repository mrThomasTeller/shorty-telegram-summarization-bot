import assert from 'assert';
import type TelegramBot from 'node-telegram-bot-api';
import type TelegramBotService from '../services/TelegramBotService';

// the message is in private chat with the bot or in a group chat addressed to the bot
export async function isCommandForBot(
  bot: TelegramBotService,
  message: TelegramBot.Message
): Promise<boolean> {
  const botName = await bot.getUsername();
  assert(botName);

  return (
    (message.chat.type === 'private' || message.text?.includes(`@${botName}`) === true) &&
    message.text?.startsWith('/') === true
  );
}
