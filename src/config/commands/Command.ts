import type TelegramBot from 'node-telegram-bot-api';

type Command = TelegramBot.BotCommand & {
  ignoreWhiteList?: boolean;
  allowInMaintenance?: boolean;
  adminOnly?: boolean;
  hide?: boolean;
  scope?: 'default' | 'all_private_chats' | 'all_group_chats';
};

export default Command;
