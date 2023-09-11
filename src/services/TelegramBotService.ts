import type TelegramBot from 'node-telegram-bot-api';

type TelegramBotService = {
  getUsername: () => Promise<string | undefined>;

  /**
   * @returns unsubscribe function
   */
  onAnyMessage: (callback: (msg: TelegramBot.Message) => void) => VoidFunction;

  sendMessage: (chatId: number, text: string) => Promise<void>;
  setMyCommands: (commands: TelegramBot.BotCommand[]) => Promise<void>;
};

export default TelegramBotService;
