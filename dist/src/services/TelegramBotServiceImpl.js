import TelegramBot from 'node-telegram-bot-api';
import { getEnv } from '../config/envVars.js';
export default class TelegramBotServiceImpl {
    constructor() {
        this.bot = new TelegramBot(getEnv().TELEGRAM_BOT_TOKEN, { polling: true });
    }
    async sendMessage(chatId, text, options) {
        await this.bot.sendMessage(chatId, text, {
            ...options,
            disable_web_page_preview: true,
        });
    }
    onAddedToChat(callback) {
        const listener = async (msg) => {
            const me = await this.bot.getMe();
            if (msg.new_chat_member.status === 'member' &&
                msg.new_chat_member.user.id === me.id) {
                callback(msg.chat.id);
            }
        };
        this.bot.on('my_chat_member', listener);
        return () => this.bot.off('my_chat_member', listener);
    }
    onAnyMessage(callback) {
        const regexp = /.*/;
        this.bot.onText(regexp, callback);
        return () => this.bot.removeTextListener(regexp);
    }
    async setMyCommands(commands) {
        await this.bot.setMyCommands(commands);
    }
    async getUsername() {
        const me = await this.bot.getMe();
        return me.username;
    }
}
