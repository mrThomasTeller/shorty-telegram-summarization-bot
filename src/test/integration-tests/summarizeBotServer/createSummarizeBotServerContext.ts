import summarizeBotServer from '../../../entryPoints/summarizeBotServer';
import { setTimeout } from 'timers/promises';
import createContext, { type TestContext } from '../lib/createContext';

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
