import type TelegramBot from 'node-telegram-bot-api';

type Command = TelegramBot.BotCommand & {
  whiteListOnly: boolean;
  allowInMaintenance: boolean;
  adminOnly?: boolean;
};

export default Command;
