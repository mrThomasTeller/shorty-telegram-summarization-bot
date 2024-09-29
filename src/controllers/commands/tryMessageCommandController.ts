import logger from '../../config/logger.ts';
import { getCommandParams } from '../../data/telegramBotMessageUtils.ts';
import tryTelegramMessage from '../../useCases/tryTelegramMessage.ts';
import type ChatController from '../ChatController.ts';

const tryMessageCommandController: ChatController = ({ chat$, chatId, services }) => {
  chat$.subscribe(async (msg) => {
    try {
      const news = getCommandParams(msg);

      if (news.trim() !== '') {
        await tryTelegramMessage(chatId, services.telegramBot, news);
      }
    } catch (error) {
      logger.error('Error in tryMessageCommandController', error);
    }
  });
};

export default tryMessageCommandController;
