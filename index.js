import TelegramBot from 'node-telegram-bot-api';
import { ChatGPTAPI } from 'chatgpt';

const token = '6269585495:AAGkoNZE62dPhYjnGSLcd13Zb5MYgUjleuY';
const chatGPTAPIKey = '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';

const bot = new TelegramBot(token, { polling: true });

const api = new ChatGPTAPI({ apiKey: chatGPTAPIKey });

const chats = new Map();

function getChatMessages(chatId, fromDate) {
  // eslint-disable-next-line no-return-assign
  let messages = chats.get(chatId) ?? [];
  messages = messages.filter((message) => message.date >= fromDate);
  chats.set(chatId, messages);
  return messages;
}

bot.onText(/.*/, async (msg) => {
  const { text } = msg;
  if (!text) return;

  const fromDate = Math.floor((Date.now() - 86400000) / 1000); // 24 hours ago
  const chat = getChatMessages(msg.chat.id, fromDate);

  if (text.includes('/summarize')) {
    const chatId = msg.chat.id;

    bot.sendMessage(chatId, 'Собираю сообщения за последний день...');

    try {
      const messages = await fetchMessages(chatId, fromDate);
      const text = messages.map((msg) => msg.text).join('\n');
      const summary = await getSummary(text);

      bot.sendMessage(chatId, `Краткая выжимка:\n\n${summary}`);
    } catch (error) {
      console.error(error);
      bot.sendMessage(
        chatId,
        'Произошла ошибка при обработке запроса. Пожалуйста, попробуйте еще раз.'
      );
    }
  } else {
    chat.push(msg);
  }
});

console.log('Summarize telegram bot started');

async function getSummary(text) {
  const maxLength = 4000;
  const textParts = splitText(text, maxLength);
  const summaries = [];

  for (const part of textParts) {
    const response = await api.sendMessage(`Сделай краткую выжимку из этих сообщений:\n${part}`, {
      completionParams: { max_tokens: 2048 },
    });

    summaries.push(response.text.trim());
  }

  return summaries.join('\n\n');
}

async function fetchMessages(chatId, fromDate) {
  const chat = getChatMessages(chatId);
  return chat.filter((message) => message.date >= fromDate);
}

function splitText(text, maxLength) {
  const parts = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    let endIndex = startIndex + maxLength;
    if (endIndex > text.length) {
      endIndex = text.length;
    } else {
      endIndex = text.lastIndexOf('\n', endIndex);
      if (endIndex === -1) {
        endIndex = text.indexOf('\n', startIndex + maxLength);
      }
    }

    parts.push(text.slice(startIndex, endIndex).trim());
    startIndex = endIndex;
  }

  return parts;
}