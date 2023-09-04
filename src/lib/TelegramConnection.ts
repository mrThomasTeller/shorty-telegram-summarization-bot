import { PrismaClient } from '@prisma/client';
import type TelegramBotService from '../services/TelegramBotService.js';

const prisma = new PrismaClient();

class TelegramConnection {
  readonly bot: TelegramBotService;

  constructor(bot: TelegramBotService) {
    this.bot = bot;
  }

  async sendToAllChats(text: string): Promise<number> {
    const chats = await prisma.chat.findMany();

    let count = 0;
    for (const chat of chats) {
      try {
        await this.bot.sendMessage(Number(chat.id), text);
        count += 1;
      } catch (error) {
        if (error instanceof Error) {
          console.error(`Не могу отправить сообщение: ${error.message}`);
        }
      }
    }

    return count;
  }
}

export default TelegramConnection;
