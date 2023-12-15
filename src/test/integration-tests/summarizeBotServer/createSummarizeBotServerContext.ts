import summarizeBotServer from '../../../entryPoints/summarizeBotServer.js';
import { setTimeout } from 'node:timers/promises';
import createContext, { type TestContext } from '../lib/createContext.js';

export default async function createSummarizeBotServerContext(): Promise<TestContext> {
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
