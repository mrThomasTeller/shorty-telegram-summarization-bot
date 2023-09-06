import type TelegramBot from 'node-telegram-bot-api';

export default function getTgCommands(): TelegramBot.BotCommand[] {
  return [
    { command: 'ping', description: 'Проверить, что бот живой' },
    { command: 'summarize', description: 'Сделать выжимку сообщений за последний день' },
  ];
}
