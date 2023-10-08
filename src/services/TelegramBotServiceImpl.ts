import TelegramBot from 'node-telegram-bot-api';
import type TelegramBotService from './TelegramBotService.ts';
import { getEnv } from '../config/envVars.ts';

export default class TelegramBotServiceImpl implements TelegramBotService {
  readonly bot: TelegramBot;

  constructor() {
    this.bot = new TelegramBot(getEnv().TELEGRAM_BOT_TOKEN, { polling: true });
  }

  async sendMessage(chatId: number, text: string): Promise<void> {
    await this.bot.sendMessage(chatId, text);
  }

  onAnyMessage(callback: (msg: TelegramBot.Message) => void): VoidFunction {
    const regexp = /.*/;
    this.bot.onText(regexp, callback);
    return () => this.bot.removeTextListener(regexp);
  }

  async setMyCommands(commands: TelegramBot.BotCommand[]): Promise<void> {
    await this.bot.setMyCommands(commands);
  }

  async getUsername(): Promise<string | undefined> {
    const me = await this.bot.getMe();
    return me.username;
  }
}
