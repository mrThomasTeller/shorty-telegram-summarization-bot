import { getCommandParams } from '../../data/telegramBotMessageUtils.ts';
import tryTelegramMessage from '../../useCases/tryTelegramMessage.ts';
import type ChatController from '../ChatController.ts';

const scheduleNewsCommandController: ChatController = ({ chat$, chatId, services }) => {
  chat$.subscribe(async (msg) => {
    const news = msg.text === undefined ? '' : getCommandParams(msg.text);

    if (news.trim() !== '') {
      await tryTelegramMessage(chatId, services.telegramBot, news);
      await services.db.setNewsForAllChats(news);
      await services.telegramBot.sendMessage(chatId, `News scheduled for all chats.`);
    }
  });
};

export default scheduleNewsCommandController;
