import type DbChatMessage from '../lib/types/DbChatMessage';
import type DbService from './DbService';
import { type Chat, PrismaClient, type User } from '@prisma/client';
import { type MessageCreateInput, type UserCreateInput } from './DbService.js';

export default class DbServiceImpl implements DbService {
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async createChatMessageIfNotExists(msg: MessageCreateInput): Promise<void> {
    await this.prisma.message.upsert({
      where: {
        messageId_chatId: {
          messageId: msg.messageId,
          chatId: msg.chatId,
        },
      },
      update: {},
      create: msg,
    });
  }

  getAllChats(): Promise<Chat[]> {
    return this.prisma.chat.findMany();
  }

  getChatMessages(chatId: number, fromDate?: Date | undefined): Promise<DbChatMessage[]> {
    return this.prisma.message.findMany({
      where: {
        chatId,
        date: fromDate !== undefined ? { gte: fromDate } : undefined,
      },
      include: {
        from: true,
      },
    });
  }

  getOrCreateChat(chatId: number): Promise<Chat> {
    return this.prisma.chat.upsert({
      where: { id: chatId },
      update: {},
      create: { id: chatId },
    });
  }

  getOrCreateUser(user: UserCreateInput): Promise<User> {
    return this.prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: user,
    });
  }

  async hasMessage(messageId: number, chatId: number): Promise<boolean> {
    const message = await this.prisma.message.findUnique({
      where: {
        messageId_chatId: {
          messageId,
          chatId,
        },
      },
    });

    return message !== null;
  }
}
