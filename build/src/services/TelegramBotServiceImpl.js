import TelegramBot from 'node-telegram-bot-api';
import { required } from '../lib/utils.js';
export default class TelegramBotServiceImpl {
    bot;
    constructor() {
        this.bot = new TelegramBot(required(process.env.TELEGRAM_BOT_TOKEN), { polling: true });
    }
    async sendMessage(chatId, text) {
        await this.bot.sendMessage(chatId, text);
    }
    onAnyMessage(callback) {
        this.bot.onText(/.*/, callback);
    }
    async getUsername() {
        const me = await this.bot.getMe();
        return me.username;
    }
}
