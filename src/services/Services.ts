import type DbService from './DbService';
import type TelegramBotService from './TelegramBotService';
import type GptService from './GptService';
import type AdsService from './AdsService';

type Services = {
  ads: AdsService;
  db: DbService;
  gpt: GptService;
  telegramBot: TelegramBotService;
};

export default Services;
