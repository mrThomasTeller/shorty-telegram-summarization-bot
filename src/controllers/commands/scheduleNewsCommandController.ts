import logger from '../../config/logger.ts';
import { getCommandParams } from '../../data/telegramBotMessageUtils.ts';
import tryTelegramMessage from '../../useCases/tryTelegramMessage.ts';
import type ChatController from '../ChatController.ts';

const scheduleNewsCommandController: ChatController = ({ chat$, chatId, services }) => {
  chat$.subscribe(async (msg) => {
    try {
      const news = msg.text === undefined ? '' : getCommandParams(msg);

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
