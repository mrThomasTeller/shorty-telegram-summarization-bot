import TelegramBot from 'node-telegram-bot-api';
import { PrismaClient } from '@prisma/client';
import { required } from './utils.js';
const prisma = new PrismaClient();
class TelegramConnection {
    bot;
    constructor(bot = new TelegramBot(required(process.env.TELEGRAM_BOT_TOKEN), { polling: true })) {
        this.bot = bot;
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
