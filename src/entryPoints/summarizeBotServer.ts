import type EntryPoint from './EntryPoint.ts';
import type TelegramBot from 'node-telegram-bot-api';
import { type GroupedObservable, Observable, filter, groupBy, pipe } from 'rxjs';
import mainController from '../controllers/mainController.ts';
import { getRealCommands } from '../config/commands/index.ts';
import type TelegramBotService from '../services/TelegramBotService.ts';
import type Services from '../services/Services.ts';
import _ from 'lodash';
// import { enableLogToFile } from '../config/logToFile.ts';
// enableLogToFile();

const summarizeBotServer: EntryPoint = async (services) => {
  await services.telegramBot.setMyCommands(getRealCommands());

  createTgMessagesObservable(services.telegramBot)
    .pipe(groupNonEmptyMessagesByChatId)
    .subscribe(observeChatWithMainController(services));

  console.info('Summarize telegram bot started');
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
  (services: Services, chat$: GroupedObservable<number, TelegramBot.Message>) => {
    mainController({ chat$, chatId: chat$.key, services });
  }
);

const groupNonEmptyMessagesByChatId = pipe(
  filter((msg: TelegramBot.Message) => msg.text != null),
  groupBy((msg) => msg.chat.id)
);
