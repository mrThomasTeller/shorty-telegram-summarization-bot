import 'dotenv/config.js';
import TelegramBot from 'node-telegram-bot-api';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { EOL } from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class TelegramConnection {
  #bot;

  /** @type {Map<number, TelegramBot.Message[]>} */
  #chats;

  constructor() {
    this.chatsDir = path.join(__dirname, 'chats');
    if (!fs.existsSync(this.chatsDir)) fs.mkdirSync(this.chatsDir);

    this.#bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
  }

  get bot() {
    return this.#bot;
  }

  async addMessage(chatId, messageRaw) {
    const message = {
      message_id: messageRaw.message_id,
      text: messageRaw.text,
      from: messageRaw.from,
      date: messageRaw.date,
    };
    const messages = await this.getChatMessages(chatId);
    messages.push(message);
    fs.promises.appendFile(
      path.join(this.chatsDir, chatId.toString()),
      `${JSON.stringify(message)}${EOL}`
    );
  }

  /** @returns {Promise<TelegramBot.Message[]>} */
  async getChatMessages(chatId, fromDate) {
    await this.#loadChats();

    let messages = this.#chats.get(chatId) ?? [];
    if (fromDate) {
      messages = messages.filter((message) => message.date >= fromDate);
    }
    this.#chats.set(chatId, messages);
    return messages;
  }

  async sendToAllChats(text) {
    await this.#loadChats();

    let count = 0;
    for (const chatId of this.#chats.keys()) {
      try {
        await this.#bot.sendMessage(chatId, text);
        count += 1;
        // eslint-disable-next-line no-empty
      } catch (error) {}
    }

    return count;
  }

  async #loadChats() {
    if (this.#chats) return;

    this.#chats = new Map();

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
}

export default TelegramConnection;
