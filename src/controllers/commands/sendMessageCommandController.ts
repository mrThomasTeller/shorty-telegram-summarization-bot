import logger from '../../config/logger';
import { getCommandParameter } from '../../data/telegramBotMessageUtils';
import tryTelegramMessage from '../../useCases/tryTelegramMessage';
import type ChatController from '../ChatController';

const sendMessageCommandController: ChatController = ({ chat$, chatId, services }) => {
  chat$.subscribe(async (msg) => {
    try {
      const text = msg.text === undefined ? '' : getCommandParameter(msg);

      if (text.trim() !== '') {
        const [users = '', ...messageParts] = text.split('\n');
        const usersArray = users.split(',').map((user) => Number(user.trim()));
        const message = messageParts.join('\n');

        await tryTelegramMessage(chatId, services.telegramBot, message);

        let successSent = 0;
        for (const user of usersArray) {
          const success = await services.telegramBot.sendMessage(user, message, {
            parse_mode: 'MarkdownV2',
          });
          if (success) successSent++;
        }

        await services.telegramBot.sendMessage(
          chatId,
          `✅ ${successSent} из ${usersArray.length} сообщений отправлено`
        );
      }
    } catch (error) {
      logger.error('Error in sendMessageCommandController', error);
    }
  });
};

export default sendMessageCommandController;
