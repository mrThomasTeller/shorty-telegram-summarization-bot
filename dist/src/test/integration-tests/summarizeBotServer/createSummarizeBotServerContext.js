import summarizeBotServer from '../../../entryPoints/summarizeBotServer.js';
import { setTimeout } from 'node:timers/promises';
import createContext from '../lib/createContext.js';
export default async function createSummarizeBotServerContext() {
    const context = createContext();
    const { telegramBot, db, gpt } = context;
    void summarizeBotServer({
        telegramBot,
        db,
        gpt,
    });
    await setTimeout(0);
    return context;
}
