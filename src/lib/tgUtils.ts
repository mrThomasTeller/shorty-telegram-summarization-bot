const telegramMarkdownSpecialSymbols = ['.', '-', '!', '*', '_', '(', ')'];

export const escapeTelegramMarkdown = (text: string): string =>
  telegramMarkdownSpecialSymbols.reduce(
    (acc, symbol) => acc.replaceAll(symbol, `\\${symbol}`),
    text
  );
