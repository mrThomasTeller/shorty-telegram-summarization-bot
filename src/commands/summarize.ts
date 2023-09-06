import { sendMessageToGpt } from '../lib/gpt.js';
import { reEnumerateText, splitText } from '../lib/text.js';
import type TelegramConnection from '../lib/TelegramConnection.js';
import { getFormattedMessage } from '../lib/summarizeUtils.js';
import type TelegramBot from 'node-telegram-bot-api';
import type Store from '../lib/Store.js';
import type TelegramBotService from '../services/TelegramBotService.js';
import { yesterday } from '../lib/utils.js';

export default async function summarize(
  telegramConnection: TelegramConnection,
  store: Store,
  msg: TelegramBot.Message
): Promise<void> {
  const chatId = msg.chat.id;
  const messagesForLastDay = await store.getChatMessages(chatId, yesterday());
  console.log(`Запрос на создание выжимки из чата ${chatId}`);

  try {
    const text = messagesForLastDay.map(getFormattedMessage).join('\n');
    await printSummary(telegramConnection.bot, chatId, text);
  } catch (error) {
    console.log(error);
    await telegramConnection.bot.sendMessage(
      chatId,
      'Произошла ошибка при обработке запроса. Пожалуйста, попробуйте еще раз.'
    );
  }
}

async function printSummary(bot: TelegramBotService, chatId: number, text: string): Promise<void> {
  await bot.sendMessage(chatId, '⚙️ Собираю сообщения за последний день...');

  const maxLength = 3400;
  const textParts = splitText(text, maxLength);
  const pointsCount =
    textParts.length === 1 ? 5 : textParts.length === 2 ? 4 : textParts.length === 3 ? 3 : 2;

  let count = 0;
  for (const part of textParts) {
    const response = await sendMessageToGpt({
      text: `Сделай краткую выжимку этих сообщений в виде ${pointsCount} пунктов идущих в хронологическом порядке. Каждый пункт - одно предложение на русском языке с подходящим по смыслу emoji в конце без точки:\n${part}`,
      onBusy: async () => {
        await bot.sendMessage(chatId, '😮‍💨 Бот усердно трудится, нужно немножко подождать');
      },
      onBroken: async () => {
        await bot.sendMessage(
          chatId,
          '💔 С ботом что-то случилось... Попробуйте позже. Мы починим его и сообщим вам как можно скорее.'
        );
      },
    });

    count += 1;
    const text = reEnumerateText(response.trim(), (count - 1) * pointsCount + 1);
    if (count === 1) {
      await bot.sendMessage(chatId, `🔡 Краткая выжимка:`);
    }
    await bot.sendMessage(chatId, text);
  }

  await bot.sendMessage(chatId, `😌 Это всё`);
}
