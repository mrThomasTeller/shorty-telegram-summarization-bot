import { type Chat } from '@prisma/client';
import { decryptIfExists } from './encryption.ts';

export const getGroupTitle = (
  chatId: bigint | number,
  chat: Chat | undefined | null,
  grammarCase: 'nom' | 'gen' = 'nom'
): string => {
  const group = grammarCase === 'nom' ? 'группа' : 'группы';
  return decryptIfExists(chat?.title) ?? `${group} ${chatId}`;
};
