import logger from '../../config/logger.ts';
import { getTariffRestText } from '../../data/tariffUtils.ts';
import type ChatController from '../ChatController.ts';

const tariffCommandController: ChatController = ({ chat$, chatId, services }) => {
  chat$.subscribe(async (msg) => {
    try {
      const text = await getTariffRestText({
        db: services.db,
        userId: msg.from?.id,
        chatId,
        thanks: true,
        telegramBot: services.telegramBot,
      });
      await services.telegramBot.sendMessage(chatId, text);
    } catch (error) {
      logger.error('Error in tariffCommandController', error);
    }
  });
};

export default tariffCommandController;
