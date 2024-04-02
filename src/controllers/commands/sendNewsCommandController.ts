import { getCommandParams } from '../../data/telegramBotMessageUtils.ts';
import { isGroupChat } from '../../data/telegramChatUtils.ts';
import type ChatController from '../ChatController.ts';

const sendNewsCommandController: ChatController = ({ chat$, chatId, services }) => {
  chat$.subscribe(async (msg) => {
    const news = msg.text === undefined ? '' : getCommandParams(msg.text);

    if (news.trim() !== '') {
      const chats = await services.db.getAllChats();
      const groupChats = chats.filter(({ id }) => isGroupChat(id));

      const sendResults = await Promise.allSettled(
        groupChats.map((chat) =>
          services.telegramBot.sendMessage(Number(chat.id), news, {
            parse_mode: 'MarkdownV2',
          })
        )
      );
      const successCount = sendResults.filter((result) => result.status === 'fulfilled').length;

      await services.telegramBot.sendMessage(chatId, `News sent to ${successCount} groups`);
    }
  });
};

export default sendNewsCommandController;
