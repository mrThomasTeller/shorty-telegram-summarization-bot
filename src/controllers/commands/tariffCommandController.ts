import { getEnv } from '../../config/envVars.ts';
import { t } from '../../config/translations/index.ts';
import type ChatController from '../ChatController.ts';

const tariffCommandController: ChatController = ({ chat$, chatId, services }) => {
  chat$.subscribe(async (msg) => {
    const subscription = await services.db.getSubscription(chatId, msg.from?.id);
    const message = subscription
      ? t('tariff.premium', { name: subscription.tariff.name })
      : t('tariff.free', { count: getEnv().MAX_SUMMARIES_PER_WEEK });

    await services.telegramBot.sendMessage(chatId, message);
  });
};

export default tariffCommandController;
