import TelegramBot from 'node-telegram-bot-api';
import { getEnv } from '../config/envVars.ts';
import type TelegramBotService from './TelegramBotService.ts';
import { type TelegramBotSendMessageOptions } from './TelegramBotService.ts';
import { required } from '../lib/common/lang.ts';

export default class TelegramBotServiceImpl implements TelegramBotService {
  readonly __bot: TelegramBot;

  constructor() {
    this.__bot = new TelegramBot(getEnv().TELEGRAM_BOT_TOKEN, { polling: true });
  }

  async getChatAdministrators(chatId: number): Promise<TelegramBot.ChatMember[]> {
    return await this.__bot.getChatAdministrators(chatId);
  }

  async getUsername(): Promise<string> {
    const me = await this.__bot.getMe();
    return required(me.username, 'bot username is required');
  }

  onAddedToGroupChat(callback: (msg: TelegramBot.ChatMemberUpdated) => void): VoidFunction {
    const listener = async (msg: TelegramBot.ChatMemberUpdated): Promise<void> => {
      const me = await this.__bot.getMe();
      if (
        msg.new_chat_member.status === 'member' &&
        msg.new_chat_member.user.id === me.id &&
        msg.chat.type !== 'private'
      ) {
        callback(msg);
      }
    };

    this.__bot.on('my_chat_member', listener);
    return () => this.__bot.off('my_chat_member', listener);
  }

  onAnyMessage(callback: (msg: TelegramBot.Message) => void): VoidFunction {
    const regexp = /.*/;
    this.__bot.onText(regexp, callback);
    return () => this.__bot.removeTextListener(regexp);
  }

  onCallbackQuery(callback: (query: TelegramBot.CallbackQuery) => void): VoidFunction {
    this.__bot.on('callback_query', callback);
    return () => this.__bot.off('callback_query', callback);
  }

  onRemovedFromGroupChat(callback: (msg: TelegramBot.ChatMemberUpdated) => void): VoidFunction {
    const listener = async (msg: TelegramBot.ChatMemberUpdated): Promise<void> => {
      const me = await this.__bot.getMe();
      const { status, user } = msg.new_chat_member;
      if (
        (status === 'left' || status === 'kicked') &&
        user.id === me.id &&
        msg.chat.type !== 'private'
      ) {
        callback(msg);
      }
    };

    this.__bot.on('my_chat_member', listener);
    return () => this.__bot.off('my_chat_member', listener);
  }

  async sendMessage(
    chatId: number,
    text: string,
    options?: TelegramBotSendMessageOptions
  ): Promise<void> {
    await this.__bot.sendMessage(chatId, text, { ...options, disable_web_page_preview: true });
  }

  async setMyCommands(commands: TelegramBot.BotCommand[]): Promise<void> {
    await this.__bot.setMyCommands(commands);
  }
}
