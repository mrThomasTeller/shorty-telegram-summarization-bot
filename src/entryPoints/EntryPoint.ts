import type DbService from '../services/DbService';
import type TelegramBotService from '../services/TelegramBotService';

export type EntryPointParams = {
  dbService: DbService;
  telegramBotService: TelegramBotService;
};

type EntryPoint = (params: EntryPointParams) => Promise<void>;

export default EntryPoint;
