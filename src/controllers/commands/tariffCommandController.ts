import { getEnv } from '../../config/envVars.ts';
import { t } from '../../config/translations/index.ts';
import type ChatController from '../ChatController.ts';

const tariffCommandController: ChatController = ({ chat$, chatId, services }) => {
  chat$.subscribe(async (msg) => {
    const tariff = await services.db.getTariff(chatId, msg.from?.username);
    const message = tariff
      ? t('tariff.premium', { name: tariff.name })
      : t('tariff.free', { count: getEnv().MAX_SUMMARIES_PER_WEEK });

    await services.telegramBot.sendMessage(chatId, message);
  });
};

export default tariffCommandController;
