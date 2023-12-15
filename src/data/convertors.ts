import type TelegramBot from 'node-telegram-bot-api';
import {
  type MessageCreateInput,
  type UserCreateInput,
} from '../services/DbService.js';
import { type Chat, type User } from '@prisma/client';
import { encrypt, encryptIfExists } from './encryption.js';

export const convertTgUserToDbUserInput = (
  user: TelegramBot.User
): UserCreateInput => ({
  id: user.id,
  firstName: encrypt(user.first_name),
  lastName: encryptIfExists(user.last_name),
  username: encryptIfExists(user.username),
});

export const convertTgMessageToDbMessageInput = (
  msg: TelegramBot.Message,
  chat: Chat,
  user: User | undefined
): MessageCreateInput => ({
  messageId: msg.message_id,
  chatId: chat.id,
  text: encryptIfExists(msg.text),
  date: new Date(msg.date * 1000),
  userId: user?.id,
});
