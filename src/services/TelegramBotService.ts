import type TelegramBot from 'node-telegram-bot-api';

export type TelegramBotSendMessageOptions = Pick<
  TelegramBot.SendMessageOptions,
  'parse_mode' | 'reply_markup'
>;

type TelegramBotService = {
  readonly __bot: TelegramBot;

  getChatAdministrators: (chatId: number) => Promise<TelegramBot.ChatMember[]>;

  getMe: () => Promise<TelegramBot.User>;

  getUsername: () => Promise<string>;

  isInChat: (chatId: number) => Promise<boolean>;

  /**
   * @returns unsubscribe function
   */
  onAddedToGroupChat: (callback: (msg: TelegramBot.ChatMemberUpdated) => void) => VoidFunction;

  /**
   * @returns unsubscribe function
   */
  onRemovedFromGroupChat: (callback: (msg: TelegramBot.ChatMemberUpdated) => void) => VoidFunction;

  /**
   * @returns unsubscribe function
   */
  onAnyMessage: (callback: (msg: TelegramBot.Message) => void) => VoidFunction;

  /**
   * @returns unsubscribe function
   */
  onCallbackQuery: (callback: (query: TelegramBot.CallbackQuery) => void) => VoidFunction;

  sendMessage: (
    chatId: number,
    text: string,
    options?: TelegramBotSendMessageOptions
  ) => Promise<void>;

  setMyCommands: (commands: TelegramBot.BotCommand[]) => Promise<void>;
};

export default TelegramBotService;
