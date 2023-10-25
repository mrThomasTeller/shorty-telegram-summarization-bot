const telegramMarkdownSpecialSymbols = ['.', '-', '!', '*', '_', '(', ')'];

export const escapeTelegramMarkdown = (text: string): string =>
  telegramMarkdownSpecialSymbols.reduce(
    (acc, symbol) => acc.replaceAll(symbol, `\\${symbol}`),
    text
  );

export const getTgCommandParams = (text: string): string => {
  const [_command, params] = text.split(/[\n ](.*)/s);
  return params ?? '';
};
