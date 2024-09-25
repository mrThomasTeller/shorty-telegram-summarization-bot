import type TelegramBot from 'node-telegram-bot-api';

type Command = TelegramBot.BotCommand & {
  ignoreWhiteList?: boolean;
  allowInMaintenance?: boolean;
  adminOnly?: boolean;
  hide?: boolean;
  privateChatOnly?: boolean;
};

export default Command;
