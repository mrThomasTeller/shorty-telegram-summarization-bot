import logger from '../../config/logger';
import { getCommandParameter } from '../../data/telegramBotMessageUtils';
import tryTelegramMessage from '../../useCases/tryTelegramMessage';
import type ChatController from '../ChatController';

const tryMessageCommandController: ChatController = ({ chat$, chatId, services }) => {
  chat$.subscribe(async (msg) => {
    try {
      const news = getCommandParameter(msg);

      if (news.trim() !== '') {
        await tryTelegramMessage(chatId, services.telegramBot, news);
      }
    } catch (error) {
      logger.error('Error in tryMessageCommandController', error);
    }
  });
};

export default tryMessageCommandController;
