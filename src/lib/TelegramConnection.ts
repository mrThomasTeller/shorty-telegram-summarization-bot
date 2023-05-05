import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';
import assert from 'assert';
import type ChatMessage from './types/ChatMessage.ts';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class TelegramConnection {
  readonly bot: TelegramBot;

  constructor() {
    assert(process.env.TELEGRAM_BOT_TOKEN);
    this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
  }

  async addMessage(chatId: TelegramBot.ChatId, message: TelegramBot.Message): Promise<void> {
    const user =
      message.from === undefined
        ? undefined
        : await prisma.user.upsert({
            where: { id: message.from.id },
            update: {},
            create: {
              id: message.from.id,
              firstName: message.from.first_name,
              lastName: message.from.last_name,
              username: message.from.username,
            },
          });

    const chat = await prisma.chat.upsert({
      where: { id: Number(chatId) },
      update: {},
      create: { id: Number(chatId) },
    });

    await prisma.message.create({
      data: {
        id: message.message_id,
        text: message.text,
        date: message.date,
        userId: user?.id,
        chatId: chat.id,
      },
    });
  }

  async getChatMessages(chatId: TelegramBot.ChatId, fromDate?: number): Promise<ChatMessage[]> {
    return await prisma.message.findMany({
      where: {
        chatId: Number(chatId),
        date: fromDate !== undefined ? { gte: fromDate } : undefined,
      },
      include: {
        from: true,
      },
    });
  }

  async sendToAllChats(text: string): Promise<number> {
    const chats = await prisma.chat.findMany();

    let count = 0;
    for (const chat of chats) {
      try {
        await this.bot.sendMessage(chat.id, text);
        count += 1;
      } catch (error) {
        if (error instanceof Error) {
          console.error(`Не могу отправить сообщение: ${error.message}`);
        }
      }
    }

    return count;
  }
}

export default TelegramConnection;
