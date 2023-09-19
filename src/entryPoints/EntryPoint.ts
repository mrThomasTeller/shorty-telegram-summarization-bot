import type DbService from '../services/DbService.ts';
import type TelegramBotService from '../services/TelegramBotService.ts';
import type GptService from '../services/GptService.ts';

export type EntryPointParams = {
  dbService: DbService;
  telegramBotService: TelegramBotService;
  gptService: GptService;
};

type EntryPoint = (params: EntryPointParams) => void | Promise<void>;

export default EntryPoint;
