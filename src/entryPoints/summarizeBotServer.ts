import _ from 'lodash';
import type TelegramBot from 'node-telegram-bot-api';
import { type GroupedObservable, Observable, filter, groupBy, pipe } from 'rxjs';
import { getVisibleCommands } from '../config/commands/index.ts';
import { getEnv } from '../config/envVars.ts';
import logger from '../config/logger.ts';
import { sendHelpMessage } from '../controllers/commands/helpCommandController.ts';
import mainController from '../controllers/mainController.ts';
import type Services from '../services/Services.ts';
import type TelegramBotService from '../services/TelegramBotService.ts';
import type EntryPoint from './EntryPoint.ts';
import subscriptionsExpirationNotifier from './summarizeBotServer/subscriptionsExpirationNotifier.ts';
import { ukassaService } from '../services/UKassaService/UKassaService.ts';
import { subscriptionsChecker } from './summarizeBotServer/subscriptionsChecker.ts';
import { encryptIfExists } from '../data/encryption.ts';
import { convertTgUserToDbUserInput } from '../data/convertors.ts';

// todo refactor this function
const summarizeBotServer: EntryPoint = async (services) => {
  ukassaService.startWebServer();

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
  void subscriptionsChecker(services);

  if (getEnv().DEV_SHOW_ALL_TG_MESSAGES) {
    services.telegramBot.onAnyMessage((msg) => {
      // eslint-disable-next-line no-console
      console.log(msg);
    });
    services.telegramBot.onCallbackQuery((query) => {
      // eslint-disable-next-line no-console
      console.log(query);
    });
  }
};

export default summarizeBotServer;

const addedToGroupChatHandler =
  ({ telegramBot, db }: Services) =>
  async (msg: TelegramBot.ChatMemberUpdated) => {
    // todo test
    await db.statisticsAddedToChat();
    await db.getOrCreateUser(convertTgUserToDbUserInput(msg.from));
    await db.updateChat(msg.chat.id, {
      isMember: true,
      invitedByUserId: BigInt(msg.from.id),
      title: encryptIfExists(msg.chat.title),
    });

    await sendHelpMessage(telegramBot, msg.chat.id);
  };

const removedFromGroupChatHandler =
  ({ db }: Services) =>
  async (msg: TelegramBot.ChatMemberUpdated) => {
    // todo test
    await db.statisticsRemovedFromChat();
    await db.updateChat(msg.chat.id, { isMember: false, title: encryptIfExists(msg.chat.title) });
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
