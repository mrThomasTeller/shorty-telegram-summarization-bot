import type TelegramBot from 'node-telegram-bot-api';

export type ParsedCommand = {
  command: string;
  target?: string;
};

export function parseCommand(message: TelegramBot.Message): ParsedCommand | undefined {
  const [command, target] = (message.text ?? '').split(/ |@/);
  if (command?.startsWith('/') === true) {
    return { command: command.slice(1), target };
  }
  return undefined;
}

// the message is in private chat with the bot or in a group chat addressed to the bot
export function isCommandForBot(
  parsedCommand: ParsedCommand,
  message: TelegramBot.Message,
  botName: string
): boolean {
  return message.chat.type === 'private' || parsedCommand.target === botName;
}
