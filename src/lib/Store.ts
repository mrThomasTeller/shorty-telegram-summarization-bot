import type TelegramBot from 'node-telegram-bot-api';
import type DbChatMessage from './types/DbChatMessage';
import type DbService from '../services/DbService';

class Store {
  constructor(private readonly dbService: DbService) {}

  async addMessage(msg: TelegramBot.Message): Promise<void> {
    const user =
      msg.from === undefined
        ? undefined
        : await this.dbService.getOrCreateUser({
            id: msg.from.id,
            firstName: msg.from.first_name,
            lastName: msg.from.last_name,
            username: msg.from.username,
          });

    const chat = await this.dbService.getOrCreateChat(msg.chat.id);

    await this.dbService.createChatMessageIfNotExists({
      messageId: msg.message_id,
      chatId: chat.id,
      text: msg.text,
      date: new Date(msg.date * 1000),
      userId: user?.id,
    });
  }

  getChatMessages(chatId: TelegramBot.ChatId, fromDate?: Date): Promise<DbChatMessage[]> {
    return this.dbService.getChatMessages(Number(chatId), fromDate);
  }

  hasMessage(msg: TelegramBot.Message): Promise<boolean> {
    return this.dbService.hasMessage(msg.message_id, msg.chat.id);
  }

  // async removeMessagesBeforeDate(date: Date): Promise<void> {
  //   await prisma.message.deleteMany({
  //     where: {
  //       date: { lt: date },
  //     },
  //   });
  // }
}

export default Store;
