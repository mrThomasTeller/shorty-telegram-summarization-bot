const telegramMarkdownSpecialSymbols = ['.', '-', '!', '*', '_', '(', ')'];
export const escapeTelegramMarkdown = (text) => telegramMarkdownSpecialSymbols.reduce((acc, symbol) => acc.replaceAll(symbol, `\\${symbol}`), text);
