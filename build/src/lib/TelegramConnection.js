import TelegramBot from 'node-telegram-bot-api';
import assert from 'assert';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
class TelegramConnection {
    bot;
    constructor() {
        assert(process.env.TELEGRAM_BOT_TOKEN);
        this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
    }
    async sendToAllChats(text) {
        const chats = await prisma.chat.findMany();
        let count = 0;
        for (const chat of chats) {
            try {
                await this.bot.sendMessage(Number(chat.id), text);
                count += 1;
            }
            catch (error) {
                if (error instanceof Error) {
                    console.error(`Не могу отправить сообщение: ${error.message}`);
                }
            }
        }
        return count;
    }
}
export default TelegramConnection;
