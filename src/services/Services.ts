import type DbService from './DbService.ts';
import type TelegramBotService from './TelegramBotService.ts';
import type GptService from './GptService.ts';

type Services = {
  db: DbService;
  telegramBot: TelegramBotService;
  gpt: GptService;
};

export default Services;
