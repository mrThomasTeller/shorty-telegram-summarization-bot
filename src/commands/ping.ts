import type TelegramConnection from '../lib/TelegramConnection.js';
import type TelegramBot from 'node-telegram-bot-api';
import packageJson from '../../package.json' assert { type: 'json' };

export default async function ping(
  telegramConnection: TelegramConnection,
  msg: TelegramBot.Message
): Promise<void> {
  await telegramConnection.bot.sendMessage(
    msg.chat.id,
    `
💻 Бот тут
Environment: ${process.env.NODE_ENV ?? 'unknown'}
Version: ${packageJson.version}
`.trim()
  );
}
