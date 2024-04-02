import { getCommandParams } from '../../data/telegramBotMessageUtils.ts';
import type ChatController from '../ChatController.ts';

const sendNewsTryCommandController: ChatController = ({ chat$, chatId, services }) => {
  chat$.subscribe(async (msg) => {
    const news = msg.text === undefined ? '' : getCommandParams(msg.text);

    if (news.trim() !== '') {
      try {
        await services.telegramBot.sendMessage(chatId, news, {
          parse_mode: 'MarkdownV2',
        });
      } catch (error) {
        if (error != null && error instanceof Error) {
          await services.telegramBot.sendMessage(chatId, error.message);
        }
      }
    }
  });
};

export default sendNewsTryCommandController;
