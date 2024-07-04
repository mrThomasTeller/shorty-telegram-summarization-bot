import { match } from 'ts-pattern';
import logger from '../../config/logger.ts';
import { getSpaceSeparatedCommandParams } from '../../data/telegramBotMessageUtils.ts';
import { chatSettingsSchema } from '../../data/types/ChatSettings.ts';
import type ChatController from '../ChatController.ts';

const settingsCommandController: ChatController = ({ chat$, chatId, services }) => {
  chat$.subscribe(async (msg) => {
    try {
      const [name = '', rawValue] = getSpaceSeparatedCommandParams(msg.text ?? '');

      const value = match({ name, rawValue })
        .with({ name: 'notifyItsTimeToSummarize', rawValue: 'true' }, () => true)
        .with({ name: 'notifyItsTimeToSummarize', rawValue: 'false' }, () => false)
        .otherwise(({ rawValue }) => rawValue);

      const parseResult = chatSettingsSchema.safeParse({ [name]: value ?? '' });

      if (parseResult.success) {
        const { chat } = await services.db.getOrCreateChat(chatId);
        await services.db.updateChat(chatId, {
          settings: {
            ...chatSettingsSchema.parse(chat.settings),
            ...parseResult.data,
          },
        });

        await services.telegramBot.sendMessage(chatId, '✅ Настройки изменены');
      } else {
        await services.telegramBot.sendMessage(chatId, '❌ Неверные настройки!');
      }
    } catch (error) {
      logger.error('Error in settingsCommandController', error);
    }
  });
};

export default settingsCommandController;
