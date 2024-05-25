import { type PrismaClient } from '@prisma/client';
import type AdsService from './services/AdsService.ts';
import AdsServiceImpl from './services/AdsServiceImpl.ts';
import type DbService from './services/DbService.ts';
import DbServiceImpl from './services/DbServiceImpl.ts';
import type GptService from './services/GptService.ts';
import GptServiceImpl from './services/GptServiceImpl.ts';
import type Services from './services/Services.ts';
import type TelegramBotService from './services/TelegramBotService.ts';
import TelegramBotServiceImpl from './services/TelegramBotServiceImpl.ts';

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
