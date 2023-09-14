import type TelegramBot from 'node-telegram-bot-api';

type TelegramBotService = {
  getUsername: () => Promise<string | undefined>;
  onAnyMessage: (callback: (msg: TelegramBot.Message) => Promise<void>) => void;
  sendMessage: (chatId: number, text: string) => Promise<void>;
  setMyCommands: (commands: TelegramBot.BotCommand[]) => Promise<void>;
};

export default TelegramBotService;
