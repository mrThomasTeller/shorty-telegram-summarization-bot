import { getEnv } from '../../config/envVars.ts';
import logger from '../../config/logger.ts';
import { t } from '../../config/translations/index.ts';
import { getFirstActiveSubscription } from '../../data/subscriptionUtils.ts';
import type ChatController from '../ChatController.ts';

// todo sub сколько осталось?
const tariffCommandController: ChatController = ({ chat$, chatId, services }) => {
  chat$.subscribe(async (msg) => {
    try {
      const subscriptions = await services.db.getSubscriptions(chatId, msg.from?.id);
      const activeSubscription = getFirstActiveSubscription(subscriptions);

      const message = activeSubscription
        ? t('tariff.premium', { name: activeSubscription.tariff.name })
        : t('tariff.free', { count: getEnv().MAX_SUMMARIES_PER_WEEK });

      await services.telegramBot.sendMessage(chatId, message);
    } catch (error) {
      logger.error('Error in tariffCommandController', error);
    }
  });
};

export default tariffCommandController;
