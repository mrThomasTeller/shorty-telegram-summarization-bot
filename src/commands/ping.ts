import type TelegramConnection from '../lib/TelegramConnection.ts';
import type TelegramBot from 'node-telegram-bot-api';
import type PackageJson from '../../package.json';
import { getEnv } from '../config/env.ts';
import { dirname } from '@darkobits/fd-name';
import fs from 'fs';
import path from 'path';
import { required } from '../lib/utils.ts';

const packageJson = JSON.parse(
  fs.readFileSync(path.join(required(dirname()), '../../package.json'), 'utf-8')
) as typeof PackageJson;

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
