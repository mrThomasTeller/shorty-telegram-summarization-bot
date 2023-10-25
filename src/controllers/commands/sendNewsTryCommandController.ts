import type ChatController from '../ChatController.ts';
import { getTgCommandParams } from '../../lib/tgUtils.ts';

const sendNewsTryCommandController: ChatController = ({ chat$, chatId, services }) => {
  chat$.subscribe(async (msg) => {
    const news = msg.text === undefined ? '' : getTgCommandParams(msg.text);

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
