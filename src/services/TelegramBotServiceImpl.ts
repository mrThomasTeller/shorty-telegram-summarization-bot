import TelegramBot from "node-telegram-bot-api";
import { getEnv } from "../config/envVars";
import { required } from "../lib/common/lang";
import type DbService from "./DbService";
import type TelegramBotService from "./TelegramBotService";
import { type TelegramBotSendMessageOptions } from "./TelegramBotService";
import { isPrivateChat } from "../data/telegramChatUtils";
import { setTimeout } from "node:timers/promises";
import logger from "../config/logger";

export default class TelegramBotServiceImpl implements TelegramBotService {
  readonly __bot: TelegramBot;
  private me?: TelegramBot.User;

  constructor(private readonly db: DbService) {
    this.__bot = new TelegramBot(getEnv().TELEGRAM_BOT_TOKEN, {
      polling: true,
    });
  }

  async getMe(): Promise<TelegramBot.User> {
    return (this.me ??= await this.__bot.getMe());
  }

  async getChatAdministrators(
    chatId: number
  ): Promise<TelegramBot.ChatMember[]> {
    const members = await this.__bot.getChatAdministrators(chatId);
    return [
      ...members,
      {
        user: {
          // eslint-disable-next-line unicorn/numeric-separators-style
          id: 1087968824,
          is_bot: true,
          first_name: "Group",
          username: "GroupAnonymousBot",
        },
        status: "administrator",
      },
    ];
  }

  async getUsername(): Promise<string> {
    const me = await this.getMe();
    return required(me.username, "bot username is required");
  }

  async isInChat(chatId: number): Promise<boolean> {
    try {
      const me = await this.getMe();
      const chat = await this.__bot.getChatMember(chatId, me.id);
      return (
        chat.status !== "left" &&
        chat.status !== "kicked" &&
        chat.status !== "restricted"
      );
    } catch {
      return false;
    }
  }

  onAddedToGroupChat(
    callback: (msg: TelegramBot.ChatMemberUpdated) => void
  ): VoidFunction {
    const listener = async (
      msg: TelegramBot.ChatMemberUpdated
    ): Promise<void> => {
      const me = await this.__bot.getMe();
      if (
        msg.new_chat_member.status === "member" &&
        msg.new_chat_member.user.id === me.id &&
        msg.chat.type !== "private"
      ) {
        callback(msg);
      }
    };

    this.__bot.on("my_chat_member", listener);
    return () => this.__bot.off("my_chat_member", listener);
  }

  onAnyMessage(callback: (msg: TelegramBot.Message) => void): VoidFunction {
    this.__bot.on("message", callback);
    return () => this.__bot.removeListener("message", callback);
  }

  onCallbackQuery(
    callback: (query: TelegramBot.CallbackQuery) => void
  ): VoidFunction {
    this.__bot.on("callback_query", callback);
    return () => this.__bot.off("callback_query", callback);
  }

  onRemovedFromGroupChat(
    callback: (msg: TelegramBot.ChatMemberUpdated) => void
  ): VoidFunction {
    const listener = async (
      msg: TelegramBot.ChatMemberUpdated
    ): Promise<void> => {
      const me = await this.__bot.getMe();
      const { status, user } = msg.new_chat_member;
      if (
        (status === "left" || status === "kicked") &&
        user.id === me.id &&
        msg.chat.type !== "private"
      ) {
        callback(msg);
      }
    };

    this.__bot.on("my_chat_member", listener);
    return () => this.__bot.off("my_chat_member", listener);
  }

  // todo ставить сообщения в очередь (не более 5 для одного чата в секунду)
  async sendMessage(
    chatId: number,
    text: string,
    options?: TelegramBotSendMessageOptions
  ): Promise<boolean> {
    try {
      const replyMarkup = options?.reply_markup;

      // удаляем клавиатуру, если она была показана
      if (isPrivateChat(chatId)) {
        const chat = await this.db.getChat(chatId);
        if (
          chat?.replyKeyboardShown &&
          replyMarkup &&
          ("inline_keyboard" in replyMarkup || "force_reply" in replyMarkup)
        ) {
          const [, msg] = await Promise.all([
            this.db.updateChat(chatId, {
              title: undefined,
              replyKeyboardShown: false,
            }),
            this.__bot.sendMessage(chatId, ".", {
              reply_markup: {
                remove_keyboard: true,
              },
            }),
          ]);
          await this.__bot.deleteMessage(chatId, msg.message_id);
        }
      }

      await Promise.all([
        this.trySendMessage(chatId, text, {
          ...options,
          disable_web_page_preview: true,
          reply_markup: replyMarkup ?? {
            remove_keyboard: true,
          },
        }),
        replyMarkup &&
          "keyboard" in replyMarkup &&
          this.db.updateChat(chatId, {
            title: undefined,
            replyKeyboardShown: true,
          }),
      ]);
      return true;
    } catch (error) {
      logger.error("Error in telegram bot service sendMessage", error);
      return false;
    }
  }

  async trySendMessage(
    chatId: number,
    text: string,
    options?: TelegramBot.SendMessageOptions
  ): Promise<void> {
    try {
      await this.__bot.sendMessage(chatId, text, options);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error?.response?.body?.error_code === 429) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        const retryAfter = error.response.body.parameters.retry_after;
        await setTimeout(retryAfter * 1000);
        await this.trySendMessage(chatId, text, options);
      } else {
        throw error;
      }
    }
  }

  async setMyCommands(
    commands: TelegramBot.BotCommand[],
    options?: { scope?: TelegramBot.BotCommandScope }
  ): Promise<void> {
    await this.__bot.setMyCommands(commands, options);
  }
}
