import type EntryPoint from './EntryPoint.js';
import type TelegramBot from 'node-telegram-bot-api';
import {
  type GroupedObservable,
  Observable,
  filter,
  groupBy,
  pipe,
} from 'rxjs';
import mainController from '../controllers/mainController.js';
import { getRealCommands } from '../config/commands/index.js';
import type TelegramBotService from '../services/TelegramBotService.js';
import type Services from '../services/Services.js';
import _ from 'lodash';
import logger from '../config/logger.js';
import { sendHelpMessage } from '../controllers/commands/helpCommandController.js';
import { catchError } from '../lib/async.js';

// todo refactor this function
const summarizeBotServer: EntryPoint = async (services) => {
  await services.telegramBot.setMyCommands(getRealCommands());

  services.telegramBot.onAddedToChat((chatId) => {
    catchError(sendHelpMessage(services.telegramBot, chatId));
  });

  createTgMessagesObservable(services.telegramBot)
    .pipe(groupNonEmptyMessagesByChatId)
    .subscribe(observeChatWithMainController(services));

  logger.info('Summarize telegram bot started');
};

export default summarizeBotServer;

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
  (
    services: Services,
    chat$: GroupedObservable<number, TelegramBot.Message>
  ) => {
    mainController({ chat$, chatId: chat$.key, services });
  }
);

const groupNonEmptyMessagesByChatId = pipe(
  filter((msg: TelegramBot.Message) => msg.text != null),
  groupBy((msg) => msg.chat.id)
);
