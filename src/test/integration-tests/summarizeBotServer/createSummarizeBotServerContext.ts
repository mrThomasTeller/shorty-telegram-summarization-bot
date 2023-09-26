import summarizeBotServer from '../../../entryPoints/summarizeBotServer.ts';
import { setTimeout } from 'node:timers/promises';
import createContext, { type TestContext } from '../lib/createContext.ts';

export default async function createSummarizeBotServerContext(): Promise<TestContext> {
  const context = createContext();
  const { telegramBotService, dbService, gptService } = context;

  void summarizeBotServer({
    telegramBotService,
    dbService,
    gptService,
  });
  await setTimeout(0);

  return context;
}
