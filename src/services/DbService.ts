import {
  type User,
  type Chat,
  type Summary,
  type PrismaClient,
} from '@prisma/client';
import type DbChatMessage from '../data/DbChatMessage.js';

export type UserCreateInput = Parameters<
  PrismaClient['user']['upsert']
>[0]['create'];
export type MessageCreateInput = Parameters<
  PrismaClient['message']['upsert']
>[0]['create'] & {
  chatId: bigint;
};

type DbService = {
  createChatMessageIfNotExists: (message: MessageCreateInput) => Promise<void>;
  createSummary: (chatId: number, date: Date) => Promise<Summary>;
  getAllChats: () => Promise<Chat[]>;
  getChatMessages: (
    chatId: number,
    fromDate?: Date
  ) => Promise<DbChatMessage[]>;
  getSummariesFrom: (chatId: number, from: Date) => Promise<Summary[]>;
  getOrCreateChat: (chatId: number) => Promise<[chat: Chat, created: boolean]>;
  getOrCreateUser: (
    userInput: UserCreateInput
  ) => Promise<[user: User, created: boolean]>;
  hasMessage: (messageId: number, chatId: number) => Promise<boolean>;
};

export default DbService;
