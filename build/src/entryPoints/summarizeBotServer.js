import 'dotenv/config';
import TelegramConnection from '../lib/TelegramConnection.js';
import Store from '../lib/Store.js';
import { isCommandForBot } from '../lib/tgUtils.js';
import summarize from '../commands/summarize.js';
import ping from '../commands/ping.js';
const whiteChatsList = (process.env.WHITE_CHATS_LIST ?? '')
    .split(',')
    .map((id) => parseInt(id, 10));
export default async function summarizeBotServer(params) {
    const tg = new TelegramConnection(params.telegramBotService, params.dbService);
    const store = new Store(params.dbService);
    tg.bot.onAnyMessage(async (msg) => {
        if (msg.text == null)
            return;
        const inWhiteList = whiteChatsList.includes(msg.chat.id);
        if (await isCommandForBot(tg.bot, msg)) {
            if (process.env.MODE === 'MAINTENANCE' || !inWhiteList) {
                await tg.bot.sendMessage(msg.chat.id, '😴 Бот временно отключен для технического обслуживания. Пожалуйста, попробуйте позже.');
            }
            else {
                const command = msg.text.split(/ |@/)[0];
                switch (command) {
                    case '/summarize':
                        await summarize(tg, store, msg);
                        return;
                    case '/ping':
                        await ping(tg, msg);
                        return;
                }
            }
        }
        if (inWhiteList && !(await store.hasMessage(msg))) {
            await store.addMessage(msg);
        }
    });
    console.log('Summarize telegram bot started');
}
