import type DbService from './DbService.ts';
import type TelegramBotService from './TelegramBotService.ts';
import type GptService from './GptService.ts';
import type AdsService from './AdsService.ts';

type Services = {
  ads: AdsService;
  db: DbService;
  gpt: GptService;
  telegramBot: TelegramBotService;
};

export default Services;
