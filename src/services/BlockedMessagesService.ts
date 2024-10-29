import type TelegramBot from 'node-telegram-bot-api';

export class BlockedMessagesService {
  private readonly blockedMessages = new Map<number, TelegramBot.Message>();

  push(chatId: number, message: TelegramBot.Message): void {
    this.blockedMessages.set(chatId, message);
  }

  pop(chatId: number): TelegramBot.Message | undefined {
    const message = this.blockedMessages.get(chatId);
    if (message != null) this.blockedMessages.delete(chatId);
    return message;
  }
}

export const blockedMessagesService = new BlockedMessagesService();
