import type TelegramBot from 'node-telegram-bot-api';
import summarizeCommand from '../config/commands/summarize.ts';

export type ParsedCommand = {
  command: string;
  target?: string;
};

export function parseCommand(message: TelegramBot.Message): ParsedCommand | undefined {
  const [command, target] = (message.text ?? '').split(/[\n @]/s);
  if (command?.startsWith('/') === true) {
    return { command: command.slice(1), target };
  }
  if (command === '') {
    return { command: summarizeCommand.command, target };
  }
  return undefined;
}

export const getCommandParams = (text: string): string => {
  const [_command, params] = text.trim().split(/[\n ](.*)/s);
  return params ?? '';
};

// the message is in private chat with the bot or in a group chat addressed to the bot
export function isCommandForBot(
  parsedCommand: ParsedCommand,
  message: TelegramBot.Message,
  botName: string
): boolean {
  return message.chat.type === 'private' || parsedCommand.target === botName;
}

const telegramMarkdownSpecialSymbols = ['.', '-', '!', '*', '_', '(', ')'];

export const escapeTelegramMarkdown = (text: string): string =>
  telegramMarkdownSpecialSymbols.reduce(
    (acc, symbol) => acc.replaceAll(symbol, `\\${symbol}`),
    text
  );
