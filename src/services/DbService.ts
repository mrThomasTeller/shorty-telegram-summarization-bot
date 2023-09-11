import { type User, type Chat, type PrismaClient } from '@prisma/client';
import type DbChatMessage from '../data/DbChatMessage.ts';

export type UserCreateInput = Parameters<PrismaClient['user']['upsert']>[0]['create'];
export type MessageCreateInput = Parameters<PrismaClient['message']['upsert']>[0]['create'] & {
  chatId: bigint;
};

type DbService = {
  createChatMessageIfNotExists: (message: MessageCreateInput) => Promise<void>;
  getAllChats: () => Promise<Chat[]>;
  getChatMessages: (chatId: number, fromDate?: Date) => Promise<DbChatMessage[]>;
  getOrCreateChat: (chatId: number) => Promise<Chat>;
  getOrCreateUser: (user: UserCreateInput) => Promise<User>;
  hasMessage: (messageId: number, chatId: number) => Promise<boolean>;
};

export default DbService;
