import { getCommandParams } from '../../data/telegramBotMessageUtils.ts';
import tryTelegramMessage from '../../useCases/tryTelegramMessage.ts';
import type ChatController from '../ChatController.ts';

const tryMessageCommandController: ChatController = ({ chat$, chatId, services }) => {
  chat$.subscribe(async (msg) => {
    const news = msg.text === undefined ? '' : getCommandParams(msg.text);

    if (news.trim() !== '') {
      await tryTelegramMessage(chatId, services.telegramBot, news);
    }
  });
};

export default tryMessageCommandController;
