import 'dotenv/config';
import { sendMessageToGpt } from './lib/gpt.ts';
import { reEnumerateText, splitText } from './lib/text.ts';
import TelegramConnection from './lib/TelegramConnection.ts';
import { getFormattedMessage } from './lib/summarizeUtils.ts';
import type TelegramBot from 'node-telegram-bot-api';
import { catchError } from './lib/async.ts';

catchError(main());

async function main(): Promise<void> {
  const tg = new TelegramConnection();

  tg.bot.onText(/.*/, async (msg) => {
    if (msg.text == null) return;

    const fromDate = Math.floor((Date.now() - 86400000) / 1000); // 24 hours ago
    const chatId = msg.chat.id;
    const messages = await tg.getChatMessages(chatId, fromDate);

    if (msg.text.includes('/summarize')) {
      console.log(`Запрос на создание выжимки из чата ${chatId}`);

      try {
        const text = messages.map(getFormattedMessage).join('\n');
        await printSummary(tg.bot, chatId, text);
      } catch (error) {
        console.log(error);
        await tg.bot.sendMessage(
          chatId,
          'Произошла ошибка при обработке запроса. Пожалуйста, попробуйте еще раз.'
        );
      }
    } else if (!messages.some((m) => m.message_id === msg.message_id)) {
      await tg.addMessage(chatId, msg);
    }
  });

  console.log('Summarize telegram bot started');
}

async function printSummary(bot: TelegramBot, chatId: number, text: string): Promise<void> {
  await bot.sendMessage(chatId, '⚙️ Собираю сообщения за последний день...');

  const maxLength = 3400;
  const textParts = splitText(text, maxLength);
  const pointsCount =
    textParts.length === 1 ? 5 : textParts.length === 2 ? 4 : textParts.length === 3 ? 3 : 2;

  let count = 0;
  for (const part of textParts) {
    const response = await sendMessageToGpt({
      text: `Сделай краткую выжимку этих сообщений в виде ${pointsCount} пунктов идущих в хронологическом порядке. Каждый пункт - одно предложение на русском языке:\n${part}`,
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