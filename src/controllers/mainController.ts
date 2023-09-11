import { type GroupedObservable, groupBy, map } from 'rxjs';
import type ChatController from './ChatController.ts';
import { getEnv, getWhiteChatsList } from '../config/env.ts';
import {
  type ParsedCommand,
  isCommandForBot,
  parseCommand,
} from '../data/telegramBotMessageUtils.ts';
import { required } from '../lib/common.ts';
import commands from '../config/commands/index.ts';
import getCommandController from './commands/getCommandController.ts';
import type Command from '../config/commands/Command.ts';
import { t } from '../config/translations/index.ts';
import { catchError } from '../lib/async.ts';
import type TelegramBotService from '../services/TelegramBotService.ts';
import { filterAsync } from '../lib/rxOperators.ts';
import type TelegramBot from 'node-telegram-bot-api';
import type Services from '../services/Services.ts';

type ObserveCase = Command | 'maintenanceMessage';

type MessageAndParsedCommand = {
  msg: TelegramBot.Message;
  parsedCommand: ParsedCommand | undefined;
};

const mainController: ChatController = ({ chat$, chatId, services }) => {
  const whiteChatsList = getWhiteChatsList();

  chat$
    .pipe(
      map(
        (msg): MessageAndParsedCommand => ({
          msg,
          parsedCommand: parseCommand(msg),
        })
      ),
      filterAsync(messageHasCommandForBot(services.telegramBot)),
      groupBy(getObserveCaseForMessage(whiteChatsList))
    )
    .subscribe(observeCommandsOrSendMaintenanceMessages(chatId, services));
};

const messageHasCommandForBot =
  (telegramBot: TelegramBotService) =>
  async ({ msg, parsedCommand }: MessageAndParsedCommand): Promise<boolean> => {
    const botName = required(await telegramBot.getUsername());
    return parsedCommand === undefined || isCommandForBot(parsedCommand, msg, botName);
  };

const getObserveCaseForMessage =
  (whiteChatsList: number[]) =>
  ({ msg, parsedCommand }: MessageAndParsedCommand): ObserveCase => {
    const command = required(commands[parsedCommand?.command ?? '']);

    return (getEnv().MODE === 'MAINTENANCE' && !command.allowInMaintenance) ||
      (!whiteChatsList.includes(msg.chat.id) && command.whiteListOnly)
      ? 'maintenanceMessage'
      : command;
  };

const sendMaintenanceMessageFn = (chatId: number, telegramBot: TelegramBotService) => () => {
  catchError(telegramBot.sendMessage(chatId, t('server.maintenanceMessage')));
};

const observeCommandsOrSendMaintenanceMessages =
  (chatId: number, services: Services) =>
  (chatCommand$: GroupedObservable<ObserveCase, MessageAndParsedCommand>) => {
    if (chatCommand$.key === 'maintenanceMessage') {
      chatCommand$.subscribe(sendMaintenanceMessageFn(chatId, services.telegramBot));
    } else {
      const controller = getCommandController(chatCommand$.key);
      controller({
        chat$: chatCommand$.pipe(map(({ msg }) => msg)),
        chatId,
        services,
      });
    }
  };

export default mainController;
