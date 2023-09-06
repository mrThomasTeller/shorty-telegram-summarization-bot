import type TelegramConnection from '../lib/TelegramConnection.js';
import type TelegramBot from 'node-telegram-bot-api';
import packageJson from '../../package.json' assert { type: 'json' };
import { getEnv } from '../config/env.js';

export default async function ping(
  telegramConnection: TelegramConnection,
  msg: TelegramBot.Message
): Promise<void> {
  console.log(msg);

  await telegramConnection.bot.sendMessage(msg.chat.id, getPingResponseMessage());
}

export function getPingResponseMessage(): string {
  return `
💻 Бот тут
Environment: ${getEnv().NODE_ENV ?? 'unknown'}
Version: ${packageJson.version}
`.trim();
}
