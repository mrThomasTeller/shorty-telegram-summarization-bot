import type TelegramBot from 'node-telegram-bot-api';
import type ChatMessage from './types/ChatMessage';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class Store {
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

    await prisma.message.upsert({
      where: { id: message.message_id },
      update: {},
      create: {
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
}

export default Store;
