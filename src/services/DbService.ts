import {
  type ActivationKey,
  type Chat,
  type PrismaClient,
  type Subscription,
  type Summary,
  type Tariff,
  type User,
} from '@prisma/client';
import type DbChatMessage from '../data/DbChatMessage.ts';

export type UserCreateInput = Parameters<PrismaClient['user']['upsert']>[0]['create'];
export type MessageCreateInput = Parameters<PrismaClient['message']['upsert']>[0]['create'] & {
  chatId: bigint;
};

export type SubscriptionWithTariff = Subscription & { tariff: Tariff };

// todo разделить на несколько сервисов
type DbService = {
  countSummariesFrom: (params: {
    chatId?: number;
    userId?: number;
    from: Date;
    usedPremium?: boolean;
  }) => Promise<number>;

  createActivationKey: (tariffId: string) => Promise<ActivationKey>;

  createChatMessageIfNotExists: (
    message: MessageCreateInput
  ) => Promise<{ message: DbChatMessage; created: boolean }>;

  createSummary: (data: {
    chatId: number;
    userId?: number;
    date: Date;
    usedPremium: boolean;
  }) => Promise<Summary>;

  getActivationKey: (id: string) => Promise<ActivationKey | undefined>;

  getAllChats: () => Promise<Chat[]>;

  getAllSubscriptions: () => Promise<Subscription[]>;

  getAllUsers: () => Promise<User[]>;

  getChatMessages: (chatId: number, fromDate?: Date) => Promise<DbChatMessage[]>;

  getOrCreateChat: (chatId: number) => Promise<{ chat: Chat; created: boolean }>;

  getOrCreateUser: (userInput: UserCreateInput) => Promise<[user: User, created: boolean]>;

  getSubscription: (chatId: number, userId?: number) => Promise<SubscriptionWithTariff | undefined>;

  getSummariesFrom: (chatId: number, from: Date) => Promise<Summary[]>;

  hasMessage: (messageId: number, chatId: number) => Promise<boolean>;

  resetChatNews: (chatId: number) => Promise<void>;

  setActivationKeyUsedForSubscription: (id: string, subscriptionId: bigint) => Promise<void>;

  setChatUnsummarizedSymbols: (chatId: number, symbols: number) => Promise<void>;

  setGroupChatIsMember: (chatId: number, isMember: boolean) => Promise<void>;

  setNewsForAllChats: (news: string) => Promise<void>;

  setSubscription: (
    object: { chatId: number } | { userId: number },
    subscriber: { id: number; username?: string },
    tariffId: string
  ) => Promise<{ id: bigint }>;

  setSubscriptionNotifiedAt: (id: bigint, date: Date) => Promise<void>;

  statisticsAddedToChat: () => Promise<void>;

  statisticsRemovedFromChat: () => Promise<void>;
};

export default DbService;
