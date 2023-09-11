import type TelegramConnection from '../lib/TelegramConnection';
import type TelegramBot from 'node-telegram-bot-api';
import packageJson from '../../package.json';
import { getEnv } from '../config/env';

export default async function ping(
  telegramConnection: TelegramConnection,
  msg: TelegramBot.Message
): Promise<void> {
  await telegramConnection.bot.sendMessage(msg.chat.id, getPingResponseMessage());
}

export function getPingResponseMessage(): string {
  return `
💻 Бот тут
Environment: ${getEnv().NODE_ENV ?? 'unknown'}
Version: ${packageJson.version}
`.trim();
}
