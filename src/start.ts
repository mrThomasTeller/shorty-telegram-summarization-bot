import type EntryPoint from './entryPoints/EntryPoint.ts';
import type AdsService from './services/AdsService.ts';
import AdsServiceImpl from './services/AdsServiceImpl.ts';
import type DbService from './services/DbService.ts';
import DbServiceImpl from './services/DbServiceImpl.ts';
import type GptService from './services/GptService.ts';
import GptServiceImpl from './services/GptServiceImpl.ts';
import type Services from './services/Services.ts';
import type TelegramBotService from './services/TelegramBotService.ts';
import TelegramBotServiceImpl from './services/TelegramBotServiceImpl.ts';

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

const entryPoint = (await import(`./entryPoints/${entryPointName}.ts`)) as {
  default: EntryPoint;
};

void entryPoint.default(services, ...process.argv.slice(3));
