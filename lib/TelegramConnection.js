import TelegramBot from 'node-telegram-bot-api';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { EOL } from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class TelegramConnection {
  #bot;

  #chats;

  constructor() {
    this.chatsDir = path.join(__dirname, 'chats');
    if (!fs.existsSync(this.chatsDir)) fs.mkdirSync(this.chatsDir);

    this.#bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
    this.#chats = new Map();
  }

  get bot() {
    return this.#bot;
  }

  async loadChats() {
    const chatsFiles = await fs.promises.readdir(this.chatsDir);
    const promises = chatsFiles.map(async (chatIdStr) => {
      const chatMessagesText = await fs.promises.readFile(
        path.join(this.chatsDir, chatIdStr),
        'utf-8'
      );
      const chatMessages = chatMessagesText
        .split(EOL)
        .filter((row) => !!row)
        .map((row) => JSON.parse(row));

      this.#chats.set(Number(chatIdStr), chatMessages);
    });

    await Promise.all(promises);
  }

  getChatMessages(chatId, fromDate) {
    let messages = this.#chats.get(chatId) ?? [];
    if (fromDate) {
      messages = messages.filter((message) => message.date >= fromDate);
    }
    this.#chats.set(chatId, messages);
    return messages;
  }

  addMessage(chatId, messageRaw) {
    const message = {
      message_id: messageRaw.message_id,
      text: messageRaw.text,
      from: messageRaw.from,
      date: messageRaw.date,
    };
    const messages = this.getChatMessages(chatId);
    messages.push(message);
    fs.promises.appendFile(
      path.join(this.chatsDir, chatId.toString()),
      `${JSON.stringify(message)}${EOL}`
    );
  }
}

export default TelegramConnection;
