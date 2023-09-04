import { type EntryPointParams } from './entryPoints/EntryPoint.js';
import recoveryMessage from './entryPoints/recoveryMessage.js';
import summarizeBotServer from './entryPoints/summarizeBotServer.js';
import { catchError } from './lib/async.js';
import DbServiceImpl from './services/DbServiceImpl.js';
import TelegramBotServiceImpl from './services/TelegramBotServiceImpl.js';

async function main(): Promise<void> {
  const entryPointName = process.argv[2];

  const params: EntryPointParams = {
    dbService: new DbServiceImpl(),
    telegramBotService: new TelegramBotServiceImpl(),
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
