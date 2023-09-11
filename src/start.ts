import { type EntryPointParams } from './entryPoints/EntryPoint';
import recoveryMessage from './entryPoints/recoveryMessage';
import summarizeBotServer from './entryPoints/summarizeBotServer';
import { catchError } from './lib/async';
import DbServiceImpl from './services/DbServiceImpl';
import GptServiceImpl from './services/GptServiceImpl';
import TelegramBotServiceImpl from './services/TelegramBotServiceImpl';

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
