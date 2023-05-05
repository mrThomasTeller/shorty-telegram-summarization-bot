import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { EOL } from 'os';
import assert from 'assert';
import type ChatMessage from './types/ChatMessage.ts';
import _ from 'lodash';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class TelegramConnection {
  readonly bot: TelegramBot;

  private chats?: Map<TelegramBot.ChatId, ChatMessage[]>;

  private readonly chatsDir: string;

  constructor() {
    this.chatsDir = path.join(__dirname, '../chats');
    if (!fs.existsSync(this.chatsDir)) fs.mkdirSync(this.chatsDir);

    assert(process.env.TELEGRAM_BOT_TOKEN);
    this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
  }

  async addMessage(chatId: TelegramBot.ChatId, messageRaw: TelegramBot.Message): Promise<void> {
    const message: ChatMessage = {
      message_id: messageRaw.message_id,
      text: messageRaw.text,
      from: messageRaw.from,
      date: messageRaw.date,
    };
    const messages = await this.getChatMessages(chatId);
    messages.push(message);
    await fs.promises.appendFile(
      path.join(this.chatsDir, chatId.toString()),
      `${JSON.stringify(message)}${EOL}`
    );
  }

  async getChatMessages(chatId: TelegramBot.ChatId, fromDate?: number): Promise<ChatMessage[]> {
    const chats = await this.loadChats();

    let messages = chats.get(chatId) ?? [];
    if (fromDate != null) {
      messages = messages.filter((message) => message.date >= fromDate);
    }
    chats.set(chatId, messages);
    return messages;
  }

  async sendToAllChats(text: string): Promise<number> {
    const chats = await this.loadChats();

    let count = 0;
    for (const chatId of chats.keys()) {
      try {
        await this.bot.sendMessage(chatId, text);
        count += 1;
        // eslint-disable-next-line no-empty
      } catch (error) {
        if (_.isObject(error) && error instanceof Error) {
          console.error(`Не могу отправить сообщение: ${error.message}`);
        }
      }
    }

    return count;
  }

  private async loadChats(): Promise<NonNullable<TelegramConnection['chats']>> {
    if (this.chats !== undefined) return this.chats;

    this.chats = new Map();

    const chatsFiles = await fs.promises.readdir(this.chatsDir);
    const promises = chatsFiles.map(async (chatIdStr) => {
      const chatMessagesText = await fs.promises.readFile(
        path.join(this.chatsDir, chatIdStr),
        'utf-8'
      );
      const chatMessages = chatMessagesText
        .split(EOL)
        .filter((row) => row !== '')
        .map((row) => JSON.parse(row));

      assert(this.chats);
      this.chats.set(Number(chatIdStr), chatMessages);
    });

    await Promise.all(promises);

    return this.chats;
  }
}

export default TelegramConnection;
