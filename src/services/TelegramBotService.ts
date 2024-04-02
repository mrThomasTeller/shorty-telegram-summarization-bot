import type TelegramBot from 'node-telegram-bot-api';

export type TelegramBotSendMessageOptions = Pick<TelegramBot.SendMessageOptions, 'parse_mode' | 'reply_markup'>;

type TelegramBotService = {
  getUsername: () => Promise<string | undefined>;

  /**
   * @returns unsubscribe function
   */
  onAddedToGroupChat: (callback: (chatId: number) => void) => VoidFunction;

  /**
   * @returns unsubscribe function
   */
  onRemovedFromGroupChat: (callback: (chatId: number) => void) => VoidFunction;

  /**
   * @returns unsubscribe function
   */
  onAnyMessage: (callback: (msg: TelegramBot.Message) => void) => VoidFunction;

  sendMessage: (chatId: number, text: string, options?: TelegramBotSendMessageOptions) => Promise<void>;

  setMyCommands: (commands: TelegramBot.BotCommand[]) => Promise<void>;
};

export default TelegramBotService;
