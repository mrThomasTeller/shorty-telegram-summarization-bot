import type TelegramBot from 'node-telegram-bot-api';

type Command = TelegramBot.BotCommand & {
  whiteListOnly: boolean;
  allowInMaintenance: boolean;
};

export default Command;
