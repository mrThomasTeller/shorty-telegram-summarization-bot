import {
  type ActivationKey,
  type Chat,
  type PaymentProvider,
  type PrismaClient,
  type Subscription,
  type Summary,
  type Tariff,
  type User,
} from '@prisma/client';
import type DbChatMessage from '../data/types/DbChatMessage.ts';
import { type TOmit } from '../lib/typeUtils.ts';

export type UserCreateInput = Parameters<PrismaClient['user']['upsert']>[0]['create'];
export type MessageCreateInput = Parameters<PrismaClient['message']['upsert']>[0]['create'] & {
  chatId: bigint;
};

export type SubscriptionWithTariff = Subscription & { tariff: Tariff };

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
  addSubscription: (params: AddSubscriptionParams) => Promise<{ id: bigint }>;

  countSummariesFrom: (params: {
    chatId?: number;
    userId?: number;
    from: Date;
    usedPremium?: boolean;
  }) => Promise<number>;

  createActivationKey: (
    tariffId: string,
    userId: number,
    subscriptionId: bigint
  ) => Promise<ActivationKey>;

  createChatMessage: (message: MessageCreateInput) => Promise<DbChatMessage>;

  createSummary: (data: {
    chatId: number;
    userId?: number;
    date: Date;
    usedPremium: boolean;
  }) => Promise<Summary>;

  getActivationKey: (id: string) => Promise<ActivationKey | undefined>;

  getAllChats: () => Promise<Chat[]>;

  getAllSubscriptions: () => Promise<Subscription[]>;

  getAllTariffs: () => Promise<Tariff[]>;

  getAllUsers: () => Promise<User[]>;

  getChatMessages: (chatId: number, fromDate?: Date) => Promise<DbChatMessage[]>;

  getOrCreateChat: (chatId: number) => Promise<{ chat: Chat; created: boolean }>;

  getOrCreateUser: (userInput: UserCreateInput) => Promise<[user: User, created: boolean]>;

  getSubscriptions: (chatId: number, userId?: number) => Promise<SubscriptionWithTariff[]>;

  getSummariesFrom: (chatId: number, from: Date) => Promise<Summary[]>;

  hasMessage: (messageId: number, chatId: number) => Promise<boolean>;

  setNewsForAllChats: (news: string) => Promise<void>;

  statisticsAddedToChat: () => Promise<void>;

  statisticsRemovedFromChat: () => Promise<void>;

  updateActivationKey: (id: string, data: Partial<ActivationKey>) => Promise<void>;

  updateChat: (chatId: number, data: Partial<TOmit<Chat, 'id'>>) => Promise<void>;

  updateSubscription: (id: bigint, data: Partial<Subscription>) => Promise<void>;
};

export default DbService;
