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
  private _ads?: AdsService;
  private _db?: DbService;
  private _telegramBot?: TelegramBotService;
  private _gpt?: GptService;

  constructor(db?: DbService) {
    this._db = db;
  }

  public get prisma(): PrismaClient {
    return this.db.__prisma;
  }

  get ads(): AdsService {
    return (this._ads ??= new AdsServiceImpl());
  }

  get db(): DbService {
    return (this._db ??= new DbServiceImpl());
  }

  get telegramBot(): TelegramBotService {
    return (this._telegramBot ??= new TelegramBotServiceImpl(this.db));
  }

  get gpt(): GptService {
    return (this._gpt ??= new GptServiceImpl());
  }
}

export const createServices = (): ServicesImpl => new ServicesImpl();
