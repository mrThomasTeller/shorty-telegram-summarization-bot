import recoveryMessage from './entryPoints/recoveryMessage.ts';
import summarizeBotServer from './entryPoints/summarizeBotServer.ts';
import DbServiceImpl from './services/DbServiceImpl.ts';
import GptServiceImpl from './services/GptServiceImpl.ts';
import type Services from './services/Services.ts';
import TelegramBotServiceImpl from './services/TelegramBotServiceImpl.ts';

const entryPointName = process.argv[2];

const services: Services = {
  db: new DbServiceImpl(),
  telegramBot: new TelegramBotServiceImpl(),
  gpt: new GptServiceImpl(),
};

switch (entryPointName) {
  case 'summarizeBotServer': {
    await summarizeBotServer(services);
    break;
  }

  case 'recoveryMessage': {
    await recoveryMessage(services);
    break;
  }

  default: {
    throw new Error(`Unknown entry point: ${entryPointName ?? 'undefined'}`);
  }
}
