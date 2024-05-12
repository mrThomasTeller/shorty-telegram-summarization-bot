import {
  PrismaClient,
  type ActivationKey,
  type Chat,
  type Subscription,
  type Summary,
  type User,
} from '@prisma/client';
import _ from 'lodash';
import type DbChatMessage from '../data/DbChatMessage.ts';
import { todayMidday } from '../lib/date.ts';
import type DbService from './DbService.ts';
import {
  type MessageCreateInput,
  type SubscriptionWithTariff,
  type UserCreateInput,
} from './DbService.ts';

export default class DbServiceImpl implements DbService {
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  createActivationKey(tariffId: string): Promise<ActivationKey> {
    return this.prisma.activationKey.create({
      data: { tariffId },
    });
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

  async getActivationKey(id: string): Promise<ActivationKey | undefined> {
    return (await this.prisma.activationKey.findUnique({ where: { id } })) ?? undefined;
  }

  async getOrCreateChat(chatId: number): Promise<[chat: Chat, created: boolean]> {
    const chat = await this.prisma.chat.findUnique({ where: { id: chatId } });
    return chat === null
      ? [
          await this.prisma.chat.create({
            data: { id: chatId, isMember: true },
          }),
          true,
        ]
      : [chat, false];
  }

  async getOrCreateUser(userInput: UserCreateInput): Promise<[user: User, created: boolean]> {
    const user = await this.prisma.user.findUnique({ where: { id: userInput.id } });
    return user === null
      ? [await this.prisma.user.create({ data: userInput }), true]
      : [user, false];
  }

  async getSubscription(
    chatId: number,
    userId?: number
  ): Promise<SubscriptionWithTariff | undefined> {
    return (
      (await this.prisma.subscription.findFirst({
        where: {
          OR: _.compact([{ chatId }, userId == null ? undefined : { userId }]),
        },
        include: { tariff: true },
      })) ?? undefined
    );
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

  async resetChatNews(chatId: number): Promise<void> {
    await this.prisma.chat.update({
      where: { id: chatId },
      data: { news: null },
    });
  }

  async setGroupChatIsMember(chatId: number, isMember: boolean): Promise<void> {
    await this.prisma.chat.upsert({
      where: { id: chatId },
      create: { id: chatId, isMember },
      update: { isMember },
    });
  }

  async setNewsForAllChats(news: string): Promise<void> {
    await this.prisma.chat.updateMany({
      data: { news },
    });
  }

  async setSubscriptionNotifiedAt(id: bigint, date: Date): Promise<void> {
    await this.prisma.subscription.update({
      where: { id },
      data: { notifiedAt: date },
    });
  }

  async statisticsAddedToChat(): Promise<void> {
    await this.prisma.statistic.upsert({
      where: { date: todayMidday() },
      update: { addedToChats: { increment: 1 } },
      create: { addedToChats: 1, date: todayMidday() },
    });
  }

  async statisticsRemovedFromChat(): Promise<void> {
    await this.prisma.statistic.upsert({
      where: { date: todayMidday() },
      update: { removedFromChats: { increment: 1 } },
      create: { removedFromChats: 1, date: todayMidday() },
    });
  }

  countSummariesFrom({
    chatId,
    userId,
    from,
    usedPremium,
  }: {
    chatId?: number;
    userId?: number;
    from: Date;
    usedPremium?: boolean;
  }): Promise<number> {
    return this.prisma.summary.count({
      where: {
        chatId,
        userId,
        date: { gte: from },
        usedPremium,
      },
    });
  }

  createSummary({
    chatId,
    userId,
    date,
    usedPremium,
  }: {
    chatId: number;
    userId?: number;
    date: Date;
    usedPremium: boolean;
  }): Promise<Summary> {
    return this.prisma.summary.create({
      data: {
        chatId,
        userId,
        date,
        usedPremium,
      },
    });
  }

  getAllChats(): Promise<Chat[]> {
    return this.prisma.chat.findMany();
  }

  getAllSubscriptions(): Promise<Subscription[]> {
    return this.prisma.subscription.findMany();
  }

  getAllUsers(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  getChatMessages(chatId: number, fromDate?: Date | undefined): Promise<DbChatMessage[]> {
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

  async setActivationKeyUsedForSubscription(id: string, subscriptionId: bigint): Promise<void> {
    await this.prisma.activationKey.update({
      where: { id },
      data: { usedForSubscriptionId: subscriptionId },
    });
  }

  async setSubscription(
    object: { chatId: number } | { userId: number },
    tariffId: string
  ): Promise<{ id: bigint }> {
    const subscription = await this.prisma.subscription.upsert({
      where: object,
      create: {
        ...object,
        email: '?',
        tariffId,
      },
      update: {
        tariffId,
      },
    });

    return { id: subscription.id };
  }
}
