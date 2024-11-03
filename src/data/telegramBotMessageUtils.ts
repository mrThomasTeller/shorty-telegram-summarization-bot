import type TelegramBot from 'node-telegram-bot-api';
import summarizeCommand from '../config/commands/summarize';

export type ParsedCommand = {
  command: string;
  target?: string;
};

export function parseCommand(message: TelegramBot.Message): ParsedCommand | undefined {
  const text = transformStartCommandRedirect(message);

  const [command, target] = text.split(/[\n @]/s);
  if (command?.startsWith('/') === true) {
    return { command: command.slice(1), target };
  }
  if (command === '') {
    return { command: summarizeCommand.command, target };
  }
  return undefined;
}

export const getCommandParameter = (msg: TelegramBot.Message): string => {
  const [_command, params] = transformStartCommandRedirect(msg)
    .trim()
    .split(/[\n ](.*)/s)
    .map((s) => s.trim());
  return params ?? '';
};

export const getCommandParams = (msg: TelegramBot.Message): string[] =>
  getCommandParameter(msg)
    .split(/\s+/g)
    .map((s) => s.trim());

// the message is in private chat with the bot or in a group chat addressed to the bot
export function isCommandForBot(
  parsedCommand: ParsedCommand,
  message: TelegramBot.Message,
  botName: string
): boolean {
  return message.chat.type === 'private' || parsedCommand.target === botName;
}

const telegramMarkdownSpecialSymbols = ['.', '-', '!', '*', '_', '(', ')', '+'];

export const escapeTelegramMarkdown = (text: string): string =>
  telegramMarkdownSpecialSymbols.reduce(
    (acc, symbol) => acc.replaceAll(symbol, `\\${symbol}`),
    text
  );

export const getPrivateCommandUrl = (botName: string, command: string, ...args: string[]): string =>
  `https://t.me/${botName}?start=${command}${encodeURIComponent(
    args.map((arg) => '=' + arg).join('')
  )}`;

const transformStartCommandRedirect = (message: TelegramBot.Message): string =>
  message.chat.type === 'private' && message.text?.startsWith('/start ') === true
    ? `/${message.text.slice('/start '.length)}`.replaceAll('=', ' ')
    : message.text ?? '';
