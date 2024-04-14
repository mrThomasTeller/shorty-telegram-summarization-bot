import recoveryMessage from './entryPoints/recoveryMessage.ts';
import summarizeBotServer from './entryPoints/summarizeBotServer.ts';
import getUserId from './entryPoints/getUserId.ts';
import AdsServiceImpl from './services/AdsServiceImpl.ts';
import DbServiceImpl from './services/DbServiceImpl.ts';
import GptServiceImpl from './services/GptServiceImpl.ts';
import type Services from './services/Services.ts';
import TelegramBotServiceImpl from './services/TelegramBotServiceImpl.ts';
import { match } from 'ts-pattern';
import type AdsService from './services/AdsService.ts';
import type DbService from './services/DbService.ts';
import type GptService from './services/GptService.ts';
import type TelegramBotService from './services/TelegramBotService.ts';

const entryPointName = process.argv[2];

class ServicesImpl implements Services {
  private _ads?: AdsService;
  get ads(): AdsService {
    return (this._ads ??= new AdsServiceImpl());
  }

  private _db?: DbService;
  get db(): DbService {
    return (this._db ??= new DbServiceImpl());
  }

  private _telegramBot?: TelegramBotService;
  get telegramBot(): TelegramBotService {
    return (this._telegramBot ??= new TelegramBotServiceImpl());
  }

  private _gpt?: GptService;
  get gpt(): GptService {
    return (this._gpt ??= new GptServiceImpl());
  }
}

const services = new ServicesImpl();

const entryPoint = match(entryPointName)
  .with('getUserId', () => getUserId)
  .with('summarizeBotServer', () => summarizeBotServer)
  .with('recoveryMessage', () => recoveryMessage)
  .otherwise(() => {
    throw new Error(`Unknown entry point: ${entryPointName ?? 'undefined'}`);
  });

void entryPoint(services, ...process.argv.slice(3));
