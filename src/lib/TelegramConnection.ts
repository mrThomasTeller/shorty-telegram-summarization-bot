import type DbService from '../services/DbService.js';
import type TelegramBotService from '../services/TelegramBotService.js';

class TelegramConnection {
  constructor(readonly bot: TelegramBotService, private readonly dbService: DbService) {}

  async sendToAllChats(text: string): Promise<number> {
    const chats = await this.dbService.getAllChats();

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
