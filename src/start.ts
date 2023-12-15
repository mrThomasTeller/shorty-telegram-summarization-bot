import recoveryMessage from './entryPoints/recoveryMessage.js';
import summarizeBotServer from './entryPoints/summarizeBotServer.js';
import DbServiceImpl from './services/DbServiceImpl.js';
import GptServiceImpl from './services/GptServiceImpl.js';
import type Services from './services/Services.js';
import TelegramBotServiceImpl from './services/TelegramBotServiceImpl.js';

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
