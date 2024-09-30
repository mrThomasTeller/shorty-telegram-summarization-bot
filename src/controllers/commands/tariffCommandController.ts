import { getEnv } from '../../config/envVars.ts';
import logger from '../../config/logger.ts';
import { t } from '../../config/translations/index.ts';
import type ChatController from '../ChatController.ts';

const tariffCommandController: ChatController = ({ chat$, chatId, services }) => {
  chat$.subscribe(async (msg) => {
    try {
      const subscription = await services.db.getSubscriptions(chatId, msg.from?.id);
      // todo sub show all subscriptions
      // const message = subscription
      //   ? t('tariff.premium', { name: subscription.tariff.name })
      //   : t('tariff.free', { count: getEnv().MAX_SUMMARIES_PER_WEEK });

      // await services.telegramBot.sendMessage(chatId, message);
    } catch (error) {
      logger.error('Error in tariffCommandController', error);
    }
  });
};

export default tariffCommandController;
