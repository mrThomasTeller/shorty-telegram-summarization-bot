import type EntryPoint from './EntryPoint.ts';
import type TelegramBot from 'node-telegram-bot-api';
import { type GroupedObservable, Observable, filter, groupBy, pipe } from 'rxjs';
import mainController from '../controllers/mainController.ts';
import { getVisibleCommands } from '../config/commands/index.ts';
import type TelegramBotService from '../services/TelegramBotService.ts';
import type Services from '../services/Services.ts';
import _ from 'lodash';
import logger from '../config/logger.ts';
import { sendHelpMessage } from '../controllers/commands/helpCommandController.ts';
import subscriptionsExpirationNotifier from './summarizeBotServer/subscriptionsExpirationNotifier.ts';
import { getEnv } from '../config/envVars.ts';

// todo refactor this function
const summarizeBotServer: EntryPoint = async (services) => {
  if (getEnv().NODE_ENV === 'production') {
    await services.telegramBot.sendMessage(getEnv().ADMIN_ID, 'Я родился! 🍼');
  }

  await services.telegramBot.setMyCommands(getVisibleCommands());

  services.telegramBot.onAddedToGroupChat(addedToGroupChatHandler(services));
  services.telegramBot.onRemovedFromGroupChat(removedFromGroupChatHandler(services));

  createTgMessagesObservable(services.telegramBot)
    .pipe(groupNonEmptyMessagesByChatId)
    .subscribe(observeChatWithMainController(services));

  logger.info('Summarize telegram bot started');

  void subscriptionsExpirationNotifier(services);
};

export default summarizeBotServer;

const addedToGroupChatHandler = (services: Services) => async (chatId: number) => {
  await sendHelpMessage(services.telegramBot, chatId);

  // todo test
  await services.db.statisticsAddedToChat();
  await services.db.updateChat(chatId, { isMember: true });
};

const removedFromGroupChatHandler = (services: Services) => async (chatId: number) => {
  // todo test
  await services.db.statisticsRemovedFromChat();
  await services.db.updateChat(chatId, { isMember: false });
};

function createTgMessagesObservable(
  telegramBotService: TelegramBotService
): Observable<TelegramBot.Message> {
  return new Observable((subscriber) =>
    telegramBotService.onAnyMessage((msg) => {
      subscriber.next(msg);
    })
  );
}

const observeChatWithMainController = _.curry(
  (services: Services, chat$: GroupedObservable<number, TelegramBot.Message>) => {
    mainController({ chat$, chatId: chat$.key, services });
  }
);

const groupNonEmptyMessagesByChatId = pipe(
  filter((msg: TelegramBot.Message) => msg.text != null),
  groupBy((msg) => msg.chat.id)
);
