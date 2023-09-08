import type DbService from '../services/DbService';
import type TelegramBotService from '../services/TelegramBotService';
import type GptService from '../services/GptService';

export type EntryPointParams = {
  dbService: DbService;
  telegramBotService: TelegramBotService;
  gptService: GptService;
};

type EntryPoint = (params: EntryPointParams) => Promise<void>;

export default EntryPoint;
