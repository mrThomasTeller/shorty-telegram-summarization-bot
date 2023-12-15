import type DbChatMessage from '../data/DbChatMessage.js';
import type DbService from './DbService.js';
import {
  type Chat,
  PrismaClient,
  type User,
  type Summary,
} from '@prisma/client';
import { type MessageCreateInput, type UserCreateInput } from './DbService.js';
import _ from 'lodash';

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

  createSummary(chatId: number, date: Date): Promise<Summary> {
    return this.prisma.summary.create({
      data: {
        chatId,
        date,
      },
    });
  }

  getAllChats(): Promise<Chat[]> {
    return this.prisma.chat.findMany();
  }

  getChatMessages(
    chatId: number,
    fromDate?: Date | undefined
  ): Promise<DbChatMessage[]> {
    return this.prisma.message.findMany({
      where: {
        chatId,
        date: fromDate === undefined ? undefined : { gte: fromDate },
      },
      include: {
        from: true,
      },
    });
  }

  async getSummariesFrom(chatId: number, date: Date): Promise<Summary[]> {
    const summaries = await this.prisma.summary.findMany({
      where: {
        chatId,
        date: { gte: date },
      },
      orderBy: {
        date: 'desc',
      },
    });

    return _.sortBy(summaries, 'date');
  }

  async getOrCreateChat(
    chatId: number
  ): Promise<[chat: Chat, created: boolean]> {
    const chat = await this.prisma.chat.findUnique({ where: { id: chatId } });
    return chat === null
      ? [await this.prisma.chat.create({ data: { id: chatId } }), true]
      : [chat, false];
  }

  async getOrCreateUser(
    userInput: UserCreateInput
  ): Promise<[user: User, created: boolean]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userInput.id },
    });
    return user === null
      ? [await this.prisma.user.create({ data: userInput }), true]
      : [user, false];
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
