import _ from 'lodash';
import type TelegramBot from 'node-telegram-bot-api';
import { type GroupedObservable, Observable, filter, groupBy, pipe } from 'rxjs';
import { getVisibleCommands } from '../config/commands/index';
import { getEnv } from '../config/envVars';
import logger from '../config/logger';
import { sendHelpMessage } from '../controllers/commands/helpCommandController';
import mainController from '../controllers/mainController';
import type Services from '../services/Services';
import type TelegramBotService from '../services/TelegramBotService';
import type EntryPoint from './EntryPoint';
import { ukassaService } from '../services/UKassaService/UKassaService';
import { subscriptionsChecker } from './summarizeBotServer/subscriptionsChecker';
import { encryptIfExists } from '../data/encryption';
import { convertTgUserToDbUserInput } from '../data/convertors';

// todo refactor this function
const summarizeBotServer: EntryPoint = async (services) => {
  ukassaService.startWebServer();

  if (getEnv().NODE_ENV === 'production') {
    await services.telegramBot.sendMessage(getEnv().ADMIN_ID, 'Я родился! 🍼');
  }

  await setMyCommands(services.telegramBot);

  services.telegramBot.onAddedToGroupChat(addedToGroupChatHandler(services));
  services.telegramBot.onRemovedFromGroupChat(removedFromGroupChatHandler(services));

  mainController.onStart?.(services);

  if (!getEnv().DEV_SKIP_TG_MESSAGES) {
    createTgMessagesObservable(services.telegramBot)
      .pipe(groupNonEmptyMessagesByChatId)
      .subscribe(observeChatWithMainController(services));
  }

  logger.info('Summarize telegram bot started');

  // void subscriptionsChecker(services);

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

async function setMyCommands(telegramBot: TelegramBotService): Promise<void> {
  const commands = getVisibleCommands();
  const defaultCommands = commands.filter(
    (command) => !command.scope || command.scope === 'default'
  );
  const privateCommands = commands.filter((command) => command.scope !== 'all_group_chats');
  const groupCommands = commands.filter((command) => command.scope !== 'all_private_chats');

  await telegramBot.setMyCommands(defaultCommands);
  await telegramBot.setMyCommands(privateCommands, { scope: { type: 'all_private_chats' } });
  await telegramBot.setMyCommands(groupCommands, { scope: { type: 'all_group_chats' } });
}

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
      if (Boolean(msg.text)) {
        subscriber.next(msg);
      }
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
