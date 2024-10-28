import logger from '../../config/logger';
import { getCommandParameter } from '../../data/telegramBotMessageUtils';
import tryTelegramMessage from '../../useCases/tryTelegramMessage';
import type ChatController from '../ChatController';

const scheduleNewsCommandController: ChatController = ({ chat$, chatId, services }) => {
  chat$.subscribe(async (msg) => {
    try {
      const news = msg.text === undefined ? '' : getCommandParameter(msg);

      if (news.trim() !== '') {
        await tryTelegramMessage(chatId, services.telegramBot, news);
        await services.db.setNewsForAllChats(news);
        await services.telegramBot.sendMessage(chatId, `News scheduled for all chats.`);
      }
    } catch (error) {
      logger.error('Error in scheduleNewsCommandController', error);
    }
  });
};

export default scheduleNewsCommandController;
