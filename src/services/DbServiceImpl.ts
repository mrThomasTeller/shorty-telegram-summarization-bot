import {
  PrismaClient,
  type Chat,
  type Subscription,
  type Summary,
  type Tariff,
  type User,
} from '@prisma/client';
import _ from 'lodash';
import type DbChatMessage from '../data/types/DbChatMessage';
import { todayMidday } from '../lib/common/date';
import { type TOmit } from '../lib/common/typeUtils';
import type DbService from './DbService';
import {
  type AddSubscriptionParams,
  type MessageCreateInput,
  type SubscriptionWithTariff,
  type SubscriptionWithTariffAndChat,
  type UserCreateInput,
} from './DbService';

export default class DbServiceImpl implements DbService {
  readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async addSubscription({
    object,
    subscriber,
    ...data
  }: AddSubscriptionParams): Promise<SubscriptionWithTariffAndChat> {
    return await this.prisma.subscription.create({
      data: {
        subscriberUserId: subscriber.id,
        subscriberUserName: subscriber.username,
        ...object,
        ...data,
      },
      include: { tariff: true, chat: true },
    });
  }

  async deleteSubscription(id: bigint): Promise<void> {
    await this.prisma.subscription.delete({ where: { id } });
  }

  async createChatMessage(msg: MessageCreateInput): Promise<DbChatMessage> {
    return await this.prisma.message.create({
      data: msg,
      include: { from: true },
    });
  }

  async getOrCreateUser(userInput: UserCreateInput): Promise<[user: User, created: boolean]> {
    const user = await this.prisma.user.findUnique({ where: { id: userInput.id } });
    return user === null
      ? [await this.prisma.user.create({ data: userInput }), true]
      : [user, false];
  }

  async getSubscriptions(chatId: number, userId?: number): Promise<SubscriptionWithTariff[]> {
    return await this.prisma.subscription.findMany({
      where: {
        OR: _.compact([{ chatId }, userId == null ? undefined : { userId }]),
      },
      include: { tariff: true },
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

  getAllUserSubscriptions(userId: number): Promise<SubscriptionWithTariffAndChat[]> {
    return this.prisma.subscription.findMany({
      where: { subscriberUserId: userId },
      include: { tariff: true, chat: true },
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

  getAllSubscriptions(): Promise<SubscriptionWithTariffAndChat[]> {
    return this.prisma.subscription.findMany({
      include: { tariff: true, chat: true },
    });
  }

  getAllTariffs(): Promise<Tariff[]> {
    return this.prisma.tariff.findMany({
      orderBy: {
        price: 'asc',
      },
    });
  }

  getAllUsers(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  getChat(chatId: number): Promise<Chat | null> {
    return this.prisma.chat.findUnique({ where: { id: chatId } });
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
      orderBy: {
        date: 'asc',
      },
    });
  }

  async getSubscription(id: bigint): Promise<SubscriptionWithTariffAndChat> {
    return await this.prisma.subscription.findUniqueOrThrow({
      where: { id },
      include: { tariff: true, chat: true },
    });
  }

  async getUserSubscription(
    userId: number,
    chatId?: number
  ): Promise<SubscriptionWithTariffAndChat | null> {
    return await this.prisma.subscription.findFirst({
      where: {
        subscriberUserId: userId,
        ...(chatId == null ? { userId } : { chatId }),
      },
      include: { tariff: true, chat: true },
    });
  }

  getTariff(id: string): Promise<Tariff> {
    return this.prisma.tariff.findUniqueOrThrow({ where: { id } });
  }

  async updateChat(
    chatId: number,
    {
      settings,
      title,
      ...data
    }: Partial<TOmit<Chat, 'id' | 'title'>> & { title: Buffer | undefined }
  ): Promise<void> {
    await this.upsertChat(chatId, title);
    await this.prisma.chat.update({
      where: { id: chatId },
      data: {
        ...data,
        settings: settings ?? undefined,
      },
    });
  }

  async updateSubscription(id: bigint, data: Partial<Subscription>): Promise<void> {
    await this.prisma.subscription.update({
      where: { id },
      data,
    });
  }

  // todo объединить с updateChat
  async upsertChat(
    chatId: number,
    title: Buffer | undefined
  ): Promise<{ chat: Chat; created: boolean }> {
    let chat = await this.prisma.chat.findUnique({ where: { id: chatId } });

    if (chat && title != null && chat.title?.compare(title) !== 0) {
      chat = await this.prisma.chat.update({
        where: { id: chat.id },
        data: { title },
      });
    }

    return chat === null
      ? {
          chat: await this.prisma.chat.create({
            data: { id: chatId, isMember: true, title },
          }),
          created: true,
        }
      : { chat, created: false };
  }
}
