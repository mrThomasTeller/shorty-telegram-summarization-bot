import { CronJob } from 'cron';
import logger from '../../config/logger';
import { encryptIfExists } from '../../data/encryption';
import { getCommandParams } from '../../data/telegramBotMessageUtils';
import { getChatSettingsSchema, type ChatSettings } from '../../data/types/ChatSettings';
import type Services from '../../services/Services';
import type ChatController from '../ChatController';
import { handleSingleSummarizeRequest$ } from './summarize/summarizeCommandController';

const settingsCommandController: ChatController = ({ chat$, chatId, services }) => {
  chat$.subscribe(async (msg) => {
    if (msg.chat.type === 'private') {
      await services.telegramBot.sendMessage(chatId, '❌ Настройки можно изменять только в группе');
      return;
    }

    console.log('chatId', chatId);

    const [isInChat, admins] = await Promise.all([
      services.telegramBot.isInChat(Number(chatId)),
      services.telegramBot.getChatAdministrators(Number(chatId)),
    ]);

    console.log('isInChat', isInChat);
    console.log('admins', JSON.stringify(admins, null, 2));
    console.log('msg.from?.id', msg.from?.id);

    if (!isInChat || !admins.some((admin) => admin.user.id === msg.from?.id)) {
      await services.telegramBot.sendMessage(
        chatId,
        '❌ Только администраторы чата могут изменять настройки'
      );
      return;
    }

    try {
      const [name = '', value] = getCommandParams(msg);

      const parseResult = getChatSettingsSchema(msg.from?.id).safeParse({ [name]: value ?? '' });

      if (parseResult.success) {
        const { chat } = await services.db.upsertChat(chatId, encryptIfExists(msg.chat.title));
        await services.db.updateChat(chatId, {
          settings: {
            ...(chat.settings as ChatSettings),
            ...parseResult.data,
          },
          title: encryptIfExists(msg.chat.title),
        });

        const { autoSummarize } = parseResult.data;

        if (autoSummarize) {
          updateCronJob(chatId, autoSummarize, services);
        } else if (autoSummarize === null) {
          removeCronJob(chatId);
        }

        await services.telegramBot.sendMessage(chatId, '✅ Настройки изменены');
      } else {
        await services.telegramBot.sendMessage(chatId, '❌ Неверные настройки!');
      }
    } catch (error) {
      logger.error('Error in settingsCommandController', error);
    }
  });
};

settingsCommandController.onStart = async (services) => {
  const chats = await services.db.getAllChats();
  for (const chat of chats) {
    const settings = chat.settings as ChatSettings;
    if (settings.autoSummarize) {
      createCronJob(Number(chat.id), settings.autoSummarize, services);
    }
  }
};

export default settingsCommandController;

const cronJobs = new Map<number, CronJob>();

// todo вынести в отдельный сервис
function createCronJob(
  chatId: number,
  settings: NonNullable<ChatSettings['autoSummarize']>,
  services: Services
): void {
  const cronJob = new CronJob(
    getCronString(settings),
    async () => {
      await services.telegramBot.sendMessage(chatId, '🔄 Автоматическая выжимка');

      const observable = handleSingleSummarizeRequest$(chatId, services, {
        chat: {
          id: chatId,
          type: 'group',
        },
        from: settings.userId == null ? undefined : { id: settings.userId },
      });

      observable.subscribe();
    },
    null,
    true,
    'Europe/Moscow'
  );

  cronJobs.set(chatId, cronJob);
}

function removeCronJob(chatId: number): void {
  const cronJob = cronJobs.get(chatId);
  if (cronJob) {
    cronJob.stop();
    cronJobs.delete(chatId);
  }
}

function updateCronJob(
  chatId: number,
  time: NonNullable<ChatSettings['autoSummarize']>,
  services: Services
): void {
  removeCronJob(chatId);
  createCronJob(chatId, time, services);
}

const getCronString = (time: { minutes: number; hours: number }): string =>
  `${time.minutes} ${time.hours} * * *`;
