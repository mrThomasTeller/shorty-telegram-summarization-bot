import {
  type Chat,
  type PaymentProvider,
  type PrismaClient,
  type Subscription,
  type Summary,
  type Tariff,
  type User,
} from '@prisma/client';
import type DbChatMessage from '../data/types/DbChatMessage.ts';
import { type TOmit } from '../lib/common/typeUtils.ts';

export type UserCreateInput = Parameters<PrismaClient['user']['upsert']>[0]['create'];
export type MessageCreateInput = Parameters<PrismaClient['message']['upsert']>[0]['create'] & {
  chatId: bigint;
};

export type SubscriptionWithTariff = Subscription & { tariff: Tariff };
export type SubscriptionWithTariffAndChat = Subscription & { tariff: Tariff; chat: Chat | null };

export type AddSubscriptionParams = {
  object?: { chatId: number } | { userId: number };
  subscriber: { id: number; username?: string };
  tariffId: string;
  paymentMethodId?: string;
  paymentProvider: PaymentProvider;
  autoRenew: boolean;
  renewPeriodMonths: number;
  expires: Date;
};

// todo разделить на несколько сервисов
type DbService = {
  addSubscription: (
    params: AddSubscriptionParams,
    deleteOld?: boolean
  ) => Promise<SubscriptionWithTariffAndChat>;

  countSummariesFrom: (params: {
    chatId?: number;
    userId?: number;
    from: Date;
    usedPremium?: boolean;
  }) => Promise<number>;

  createChatMessage: (message: MessageCreateInput) => Promise<DbChatMessage>;

  createSummary: (data: {
    chatId: number;
    userId?: number;
    date: Date;
    usedPremium: boolean;
  }) => Promise<Summary>;

  deleteSubscription: (id: bigint) => Promise<void>;

  getAllChats: () => Promise<Chat[]>;

  getAllSubscriptions: () => Promise<SubscriptionWithTariffAndChat[]>;

  getAllTariffs: () => Promise<Tariff[]>;

  getAllUsers: () => Promise<User[]>;

  getChat: (chatId: number) => Promise<Chat | null>;

  getChatMessages: (chatId: number, fromDate?: Date) => Promise<DbChatMessage[]>;

  getOrCreateUser: (userInput: UserCreateInput) => Promise<[user: User, created: boolean]>;

  getSubscription: (id: bigint) => Promise<SubscriptionWithTariffAndChat>;

  getSubscriptions: (chatId: number, userId?: number) => Promise<SubscriptionWithTariff[]>;

  getSummariesFrom: (chatId: number, from: Date) => Promise<Summary[]>;

  getTariff: (id: string) => Promise<Tariff>;

  getUserChats: (userId: number) => Promise<Chat[]>;

  getUserSubscriptions: (userId: number) => Promise<SubscriptionWithTariffAndChat[]>;

  hasMessage: (messageId: number, chatId: number) => Promise<boolean>;

  setNewsForAllChats: (news: string) => Promise<void>;

  statisticsAddedToChat: () => Promise<void>;

  statisticsRemovedFromChat: () => Promise<void>;

  updateChat: (
    chatId: number,
    data: Partial<TOmit<Chat, 'id' | 'title'>> & { title: Buffer | undefined }
  ) => Promise<void>;

  updateSubscription: (id: bigint, data: Partial<Subscription>) => Promise<void>;

  upsertChat: (
    chatId: number,
    title: Buffer | undefined
  ) => Promise<{ chat: Chat; created: boolean }>;
};

export default DbService;
