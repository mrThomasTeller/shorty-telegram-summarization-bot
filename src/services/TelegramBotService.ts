import type TelegramBot from 'node-telegram-bot-api';

type TelegramBotService = {
  sendMessage: (chatId: number, text: string) => Promise<void>;
  onAnyMessage: (callback: (msg: TelegramBot.Message) => Promise<void>) => void;
  getUsername: () => Promise<string | undefined>;
};

export default TelegramBotService;
