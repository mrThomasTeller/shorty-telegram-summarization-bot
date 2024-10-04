import logger from '../../config/logger.ts';
import { t } from '../../config/translations/index.ts';
import { getLimitsData, getSummariesRestText } from '../../data/subscriptionLimits.ts';
import { required } from '../../lib/lang.ts';
import type ChatController from '../ChatController.ts';

// todo stest
const tariffCommandController: ChatController = ({ chat$, chatId, services }) => {
  chat$.subscribe(async (msg) => {
    try {
      const limitsData = await getLimitsData(services, msg);
      const botName = required(await services.telegramBot.getUsername(), 'Bot name is required');
      const restText = getSummariesRestText(limitsData, msg.chat.id, botName);

      const message = limitsData.subscription
        ? t('tariff.premium', { name: limitsData.subscription.tariff.name, rest: restText })
        : t('tariff.free', { rest: restText });

      await services.telegramBot.sendMessage(chatId, message);
    } catch (error) {
      logger.error('Error in tariffCommandController', error);
    }
  });
};

export default tariffCommandController;
