import type TelegramBot from 'node-telegram-bot-api';

export type TelegramBotSendMessageOptions = {
  parse_mode?: 'MarkdownV2' | 'HTML';
};

type TelegramBotService = {
  getUsername: () => Promise<string | undefined>;

  /**
   * @returns unsubscribe function
   */
  onAnyMessage: (callback: (msg: TelegramBot.Message) => void) => VoidFunction;

  sendMessage: (
    chatId: number,
    text: string,
    options?: TelegramBotSendMessageOptions
  ) => Promise<void>;
  setMyCommands: (commands: TelegramBot.BotCommand[]) => Promise<void>;
};

export default TelegramBotService;
