import type DbService from './DbService.js';
import type TelegramBotService from './TelegramBotService.js';
import type GptService from './GptService.js';

type Services = {
  db: DbService;
  telegramBot: TelegramBotService;
  gpt: GptService;
};

export default Services;
