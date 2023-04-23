import TelegramBot from 'node-telegram-bot-api';
// eslint-disable-next-line import/no-unresolved
import { ChatGPTAPI } from 'chatgpt';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { EOL } from 'os';
import dotenv from 'dotenv';

dotenv.config();

// eslint-disable-next-line no-underscore-dangle
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const chatsDir = path.join(__dirname, 'chats');
if (!fs.existsSync(chatsDir)) fs.mkdirSync(chatsDir);

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

const api = new ChatGPTAPI({ apiKey: process.env.GPT_API_KEY });

const chats = new Map();

main();

async function main() {
  await loadChats();

  bot.onText(/.*/, async (msg) => {
    if (!msg.text) return;

    // if (msg.text.includes('/error')) {
    //   wait(100).then(() => process.exit(1));
    //   return;
    // }

    const fromDate = Math.floor((Date.now() - 86400000) / 1000); // 24 hours ago
    const chatId = msg.chat.id;
    const messages = getChatMessages(chatId, fromDate);

    if (msg.text.includes('/summarize')) {
      console.log(`Запрос на создание выжимки из чата ${chatId}`);

      try {
        const text = messages.map(getFormattedMessage).join('\n');
        await printSummary(bot, chatId, text);
      } catch (error) {
        console.log(error);
        bot.sendMessage(
          chatId,
          'Произошла ошибка при обработке запроса. Пожалуйста, попробуйте еще раз.'
        );
      }
      // сообщение не обработано
    } else if (!messages.some((m) => m.message_id === msg.message_id)) {
      addMessage(chatId, msg);
    }
  });

  console.log('Summarize telegram bot started');
}

async function loadChats() {
  const chatsFiles = await fs.promises.readdir(chatsDir);
  const promises = chatsFiles.map(async (chatIdStr) => {
    const chatMessagesText = await fs.promises.readFile(path.join(chatsDir, chatIdStr), 'utf-8');
    const chatMessages = chatMessagesText
      .split(EOL)
      .filter((row) => !!row)
      .map((row) => JSON.parse(row));

    chats.set(Number(chatIdStr), chatMessages);
  });

  await Promise.all(promises);
}

function getChatMessages(chatId, fromDate) {
  // eslint-disable-next-line no-return-assign
  let messages = chats.get(chatId) ?? [];
  if (fromDate) {
    messages = messages.filter((message) => message.date >= fromDate);
  }
  chats.set(chatId, messages);
  return messages;
}

/**
 *
 * @param {import('node-telegram-bot-api').Message} messageRaw
 */
function addMessage(chatId, messageRaw) {
  const message = {
    message_id: messageRaw.message_id,
    text: messageRaw.text,
    from: messageRaw.from,
    date: messageRaw.date,
  };
  const messages = getChatMessages(chatId);
  messages.push(message);
  fs.promises.appendFile(
    path.join(chatsDir, chatId.toString()),
    `${JSON.stringify(message)}${EOL}`
  );
}

function getAuthorName(msg) {
  const author = msg.from;
  if (!author) return undefined;

  if (author.first_name) {
    return [author.first_name, author.last_name].filter((x) => !!x).join(' ');
  }

  return author.username;
}

/**
 * @param {import('node-telegram-bot-api').Message} msg
 */
function getFormattedMessage(msg) {
  const authorName = getAuthorName(msg);
  // const text = '(' + msg.date + ')';
  if (authorName) return `${authorName}: ${msg.text}`;
  return msg.text;
}

async function printSummary(bot, chatId, text) {
  bot.sendMessage(chatId, '⚙️ Собираю сообщения за последний день...');

  const maxLength = 3400;
  const textParts = splitText(text, maxLength);
  const pointsCount =
    textParts.length === 1 ? 5 : textParts.length === 2 ? 4 : textParts.length === 3 ? 3 : 2;

  let count = 0;
  for (const part of textParts) {
    const response = await sendMessageToGpt(
      `Сделай краткую выжимку этих сообщений в виде ${pointsCount} пунктов идущих в хронологическом порядке. Каждый пункт - одно предложение на русском языке::\n${part}`,
      () => {
        bot.sendMessage(chatId, '😮‍💨 Бот усердно трудится, нужно немножко подождать');
      }
    );

    count += 1;
    const text = reEnumerateText(response.text.trim(), (count - 1) * pointsCount + 1);
    if (count === 1) {
      bot.sendMessage(chatId, `🔡 Краткая выжимка:`);
      await wait(100);
    }
    bot.sendMessage(chatId, text);
  }

  await wait(100);
  bot.sendMessage(chatId, `😌 Это всё`);
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

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// replaces 1., 2., 3. in text with {fromNumber}., {fromNumber + 1}., {fromNumber + 2}.
function reEnumerateText(text, fromNumber) {
  // Split the text into lines
  const lines = text.split('\n');

  // Loop through each line and replace the numbers
  const updatedLines = lines.map((line) => {
    // Check if the line starts with a number followed by a period
    const match = line.match(/^(\d+)\./);
    if (match) {
      // Calculate the new number for this line
      const newNumber = parseInt(match[1], 10) - 1 + fromNumber;
      // Replace the original number with the new number
      return line.replace(match[0], `${newNumber}.`);
    }
    // If the line doesn't start with a number and a period, return it unchanged
    return line;
  });

  // Join the updated lines back together
  return updatedLines.join('\n');
}

async function sendMessageToGpt(text, onTooManyRequests) {
  try {
    return await api.sendMessage(text, {
      completionParams: { max_tokens: 2048 },
    });
  } catch (error) {
    // Too Many Requests - ждём 25 секунд
    if (error.statusCode === 429) {
      if (onTooManyRequests) onTooManyRequests();
      await wait(25_000);
      return sendMessageToGpt(text, onTooManyRequests);
    }
    throw error;
  }
}
