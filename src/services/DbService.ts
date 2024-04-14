import {
  type User,
  type Chat,
  type Summary,
  type PrismaClient,
  type Tariff,
  type Subscription,
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

  createChatMessageIfNotExists: (message: MessageCreateInput) => Promise<void>;

  createSummary: (data: {
    chatId: number;
    userId?: number;
    date: Date;
    usedPremium: boolean;
  }) => Promise<Summary>;

  getAllChats: () => Promise<Chat[]>;

  getChatMessages: (chatId: number, fromDate?: Date) => Promise<DbChatMessage[]>;

  getSubscription: (chatId: number, userId?: number) => Promise<SubscriptionWithTariff | undefined>;

  getSummariesFrom: (chatId: number, from: Date) => Promise<Summary[]>;

  getOrCreateChat: (chatId: number) => Promise<[chat: Chat, created: boolean]>;

  getOrCreateUser: (userInput: UserCreateInput) => Promise<[user: User, created: boolean]>;

  hasMessage: (messageId: number, chatId: number) => Promise<boolean>;

  resetChatNews: (chatId: number) => Promise<void>;

  setGroupChatIsMember: (chatId: number, isMember: boolean) => Promise<void>;

  setNewsForAllChats: (news: string) => Promise<void>;

  statisticsAddedToChat: () => Promise<void>;

  statisticsRemovedFromChat: () => Promise<void>;
};

export default DbService;
