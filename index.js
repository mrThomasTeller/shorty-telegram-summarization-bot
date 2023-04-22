import TelegramBot from 'node-telegram-bot-api';
import { ChatGPTAPI } from 'chatgpt';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { EOL } from 'os';

// eslint-disable-next-line no-underscore-dangle
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const chatsDir = path.join(__dirname, 'chats');
if (!fs.existsSync(chatsDir)) fs.mkdirSync(chatsDir);

const token = '6269585495:AAGkoNZE62dPhYjnGSLcd13Zb5MYgUjleuY';
const chatGPTAPIKey = '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';

const bot = new TelegramBot(token, { polling: true });

const api = new ChatGPTAPI({ apiKey: chatGPTAPIKey });

const chats = new Map();

main();

async function main() {
  await loadChats();

  bot.onText(/.*/, async (msg) => {
    const { text } = msg;
    if (!text) return;

    const fromDate = Math.floor((Date.now() - 86400000) / 1000); // 24 hours ago
    const chatId = msg.chat.id;
    const messages = getChatMessages(chatId, fromDate);

    // сообщение уже обработано
    if (messages.some((m) => m.message_id === msg.message_id)) return;

    if (text.includes('/summarize')) {
      bot.sendMessage(chatId, 'Собираю сообщения за последний день...');

      try {
        const text = messages.map(getFormattedMessage).join('\n');
        const summary = await getSummary(text);

        bot.sendMessage(chatId, `Краткая выжимка:\n\n${summary}`);
      } catch (error) {
        console.log(error);
        bot.sendMessage(
          chatId,
          'Произошла ошибка при обработке запроса. Пожалуйста, попробуйте еще раз.'
        );
      }
    } else {
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

async function getSummary(text) {
  const maxLength = 3500;
  const textParts = splitText(text, maxLength);
  const summaries = [];

  for (const part of textParts) {
    const response = await api.sendMessage(
      `Сделай краткую выжимку на русском из этих сообщений в виде 5 пунктов идущих в хронологическом порядке:\n${part}`,
      {
        completionParams: { max_tokens: 2048 },
      }
    );

    summaries.push(response.text.trim());
  }

  return summaries.join('\n\n');
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
