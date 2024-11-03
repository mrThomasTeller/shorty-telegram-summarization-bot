import TelegramBot from 'node-telegram-bot-api';
import { getEnv } from '../config/envVars';
import { required } from '../lib/common/lang';
import type DbService from './DbService';
import type TelegramBotService from './TelegramBotService';
import { type TelegramBotSendMessageOptions } from './TelegramBotService';
import { isPrivateChat } from '../data/telegramChatUtils';

export default class TelegramBotServiceImpl implements TelegramBotService {
  readonly __bot: TelegramBot;
  private me?: TelegramBot.User;

  constructor(private readonly db: DbService) {
    this.__bot = new TelegramBot(getEnv().TELEGRAM_BOT_TOKEN, { polling: true });
  }

  async getMe(): Promise<TelegramBot.User> {
    return (this.me ??= await this.__bot.getMe());
  }

  async getChatAdministrators(chatId: number): Promise<TelegramBot.ChatMember[]> {
    return await this.__bot.getChatAdministrators(chatId);
  }

  async getUsername(): Promise<string> {
    const me = await this.getMe();
    return required(me.username, 'bot username is required');
  }

  async isInChat(chatId: number): Promise<boolean> {
    try {
      const me = await this.getMe();
      const chat = await this.__bot.getChatMember(chatId, me.id);
      return chat.status !== 'left' && chat.status !== 'kicked' && chat.status !== 'restricted';
    } catch {
      return false;
    }
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
    this.__bot.on('message', callback);
    return () => this.__bot.removeListener('message', callback);
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
    const replyMarkup = options?.reply_markup;

    // удаляем клавиатуру, если она была показана
    if (isPrivateChat(chatId)) {
      const chat = await this.db.getChat(chatId);
      if (
        chat?.replyKeyboardShown &&
        replyMarkup &&
        ('inline_keyboard' in replyMarkup || 'force_reply' in replyMarkup)
      ) {
        const [, msg] = await Promise.all([
          this.db.updateChat(chatId, { title: undefined, replyKeyboardShown: false }),
          this.__bot.sendMessage(chatId, '.', {
            reply_markup: {
              remove_keyboard: true,
            },
          }),
        ]);
        await this.__bot.deleteMessage(chatId, msg.message_id);
      }
    }

    await Promise.all([
      this.__bot.sendMessage(chatId, text, {
        ...options,
        disable_web_page_preview: true,
        reply_markup: replyMarkup ?? {
          remove_keyboard: true,
        },
      }),
      replyMarkup &&
        'keyboard' in replyMarkup &&
        this.db.updateChat(chatId, { title: undefined, replyKeyboardShown: true }),
    ]);
  }

  async setMyCommands(commands: TelegramBot.BotCommand[]): Promise<void> {
    await this.__bot.setMyCommands(commands);
  }
}
