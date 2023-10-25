import TelegramBot from 'node-telegram-bot-api';
import type TelegramBotService from './TelegramBotService.ts';
import { getEnv } from '../config/envVars.ts';
import { type TelegramBotSendMessageOptions } from './TelegramBotService.ts';

export default class TelegramBotServiceImpl implements TelegramBotService {
  readonly bot: TelegramBot;

  constructor() {
    this.bot = new TelegramBot(getEnv().TELEGRAM_BOT_TOKEN, { polling: true });
  }

  async sendMessage(
    chatId: number,
    text: string,
    options?: TelegramBotSendMessageOptions
  ): Promise<void> {
    await this.bot.sendMessage(chatId, text, { ...options, disable_web_page_preview: true });
  }

  onAddedToChat(callback: (chatId: number) => void): VoidFunction {
    const listener = async (msg: TelegramBot.ChatMemberUpdated): Promise<void> => {
      const me = await this.bot.getMe();
      if (msg.new_chat_member.status === 'member' && msg.new_chat_member.user.id === me.id) {
        callback(msg.chat.id);
      }
    };

    this.bot.on('my_chat_member', listener);
    return () => this.bot.off('my_chat_member', listener);
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
