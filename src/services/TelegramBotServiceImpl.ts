import TelegramBot from 'node-telegram-bot-api';
import type TelegramBotService from './TelegramBotService';
import { getEnv } from '../config/env.js';

export default class TelegramBotServiceImpl implements TelegramBotService {
  readonly bot: TelegramBot;

  constructor() {
    this.bot = new TelegramBot(getEnv().TELEGRAM_BOT_TOKEN, { polling: true });
  }

  async sendMessage(chatId: number, text: string): Promise<void> {
    await this.bot.sendMessage(chatId, text);
  }

  onAnyMessage(callback: (msg: TelegramBot.Message) => Promise<void>): void {
    this.bot.onText(/.*/, callback);
  }

  async setMyCommands(commands: TelegramBot.BotCommand[]): Promise<void> {
    await this.bot.setMyCommands(commands);
  }

  async getUsername(): Promise<string | undefined> {
    const me = await this.bot.getMe();
    return me.username;
  }
}
