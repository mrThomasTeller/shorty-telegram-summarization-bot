import { type PrismaClient } from '@prisma/client';
import type AdsService from './services/AdsService';
import AdsServiceImpl from './services/AdsServiceImpl';
import type DbService from './services/DbService';
import DbServiceImpl from './services/DbServiceImpl';
import type GptService from './services/GptService';
import GptServiceImpl from './services/GptServiceImpl';
import type Services from './services/Services';
import type TelegramBotService from './services/TelegramBotService';
import TelegramBotServiceImpl from './services/TelegramBotServiceImpl';

export class ServicesImpl implements Services {
  public get prisma(): PrismaClient {
    return this.dbImpl.prisma;
  }

  private _ads?: AdsService;
  get ads(): AdsService {
    return (this._ads ??= new AdsServiceImpl());
  }

  private _db?: DbServiceImpl;
  get db(): DbService {
    return this.dbImpl;
  }

  private get dbImpl(): DbServiceImpl {
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

export const createServices = (): ServicesImpl => new ServicesImpl();
