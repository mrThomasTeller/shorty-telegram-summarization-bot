import { type EntryPointParams } from './entryPoints/EntryPoint.ts';
import recoveryMessage from './entryPoints/recoveryMessage.ts';
import summarizeBotServer from './entryPoints/summarizeBotServer.ts';
import { catchError } from './lib/async.ts';
import DbServiceImpl from './services/DbServiceImpl.ts';
import GptServiceImpl from './services/GptServiceImpl.ts';
import TelegramBotServiceImpl from './services/TelegramBotServiceImpl.ts';

async function main(): Promise<void> {
  const entryPointName = process.argv[2];

  const params: EntryPointParams = {
    dbService: new DbServiceImpl(),
    telegramBotService: new TelegramBotServiceImpl(),
    gptService: new GptServiceImpl(),
  };

  switch (entryPointName) {
    case 'summarizeBotServer':
      await summarizeBotServer(params);
      break;

    case 'recoveryMessage':
      await recoveryMessage(params);
      break;

    default:
      throw new Error(`Unknown entry point: ${entryPointName}`);
  }
}

catchError(main());
