import { sendMessageToGpt } from '../lib/gpt.js';
import { reEnumerateText, splitText } from '../lib/text.js';
import type TelegramConnection from '../lib/TelegramConnection.js';
import { getFormattedMessage } from '../lib/summarizeUtils.js';
import type TelegramBot from 'node-telegram-bot-api';
import type Store from '../lib/Store.js';
import type TelegramBotService from '../services/TelegramBotService.js';
import { yesterday } from '../lib/utils.js';
import type GptService from '../services/GptService';

export default async function summarize({
  telegramConnection,
  gptService,
  store,
  msg,
}: {
  telegramConnection: TelegramConnection;
  gptService: GptService;
  store: Store;
  msg: TelegramBot.Message;
}): Promise<void> {
  const chatId = msg.chat.id;
  const messagesForLastDay = await store.getChatMessages(chatId, yesterday());
  console.info(`Запрос на создание выжимки из чата ${chatId}`);

  try {
    const text = messagesForLastDay.map(getFormattedMessage).join('\n');
    await printSummary({ bot: telegramConnection.bot, gptService, chatId, text });
  } catch (error) {
    console.error(error);
    await telegramConnection.bot.sendMessage(chatId, getQueryProcessErrorMessage());
  }
}

export const getQueryProcessErrorMessage = (): string =>
  'Произошла ошибка при обработке запроса. Пожалуйста, попробуйте еще раз.';

export const getStartSummarizeMessage = (): string => '⚙️ Собираю сообщения за последний день...';

export const getEndSummarizeMessage = (): string => `😌 Это всё`;

export const getSummaryHeader = (): string => `🔡 Краткая выжимка:`;

export const getSummaryQueryMessage = (pointsCount: number, part: string): string =>
  `Сделай краткую выжимку этих сообщений в виде ${pointsCount} пунктов идущих в хронологическом порядке. Каждый пункт - одно предложение на русском языке с подходящим по смыслу emoji в конце без точки:\n${part}`;

export const getTooManyRequestsToGptErrorMessage = (): string =>
  '😮‍💨 Бот усердно трудится, нужно немножко подождать';

export const getMaxQueriesToGptExceeded = (): string =>
  '💔 С ботом что-то случилось... Попробуйте позже. Мы починим его и сообщим вам как можно скорее.';

async function printSummary({
  bot,
  gptService,
  chatId,
  text,
}: {
  bot: TelegramBotService;
  gptService: GptService;
  chatId: number;
  text: string;
}): Promise<void> {
  await bot.sendMessage(chatId, getStartSummarizeMessage());

  const maxLength = 3400;
  const textParts = splitText(text, maxLength);
  const pointsCount =
    textParts.length === 1 ? 5 : textParts.length === 2 ? 4 : textParts.length === 3 ? 3 : 2;

  let count = 0;
  for (const part of textParts) {
    const response = await sendMessageToGpt({
      gptService,
      text: getSummaryQueryMessage(pointsCount, part),
      onBusy: async () => {
        await bot.sendMessage(chatId, getTooManyRequestsToGptErrorMessage());
      },
      onBroken: async () => {
        await bot.sendMessage(chatId, getMaxQueriesToGptExceeded());
      },
    });

    count += 1;
    const text = reEnumerateText(response.trim(), (count - 1) * pointsCount + 1);
    if (count === 1) {
      await bot.sendMessage(chatId, getSummaryHeader());
    }
    await bot.sendMessage(chatId, text);
  }

  await bot.sendMessage(chatId, getEndSummarizeMessage());
}
