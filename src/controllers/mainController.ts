import { type GroupedObservable, groupBy, map } from 'rxjs';
import type ChatController from './ChatController.js';
import { getEnv, getWhiteChatsList } from '../config/envVars.js';
import {
  type ParsedCommand,
  isCommandForBot,
  parseCommand,
} from '../data/telegramBotMessageUtils.js';
import { required } from '../lib/common.js';
import commands from '../config/commands/index.js';
import getCommandController from './commands/getCommandController.js';
import type Command from '../config/commands/Command.js';
import { t } from '../config/translations/index.js';
import { catchError } from '../lib/async.js';
import type TelegramBotService from '../services/TelegramBotService.js';
import { filterAsync } from '../lib/rxOperators.js';
import type TelegramBot from 'node-telegram-bot-api';
import type Services from '../services/Services.js';
import logger from '../config/logger.js';
import noneCommand from '../config/commands/none.js';

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
    return (
      parsedCommand === undefined ||
      isCommandForBot(parsedCommand, msg, botName)
    );
  };

const getObserveCaseForMessage =
  (whiteChatsList: number[] | undefined) =>
  ({ msg, parsedCommand }: MessageAndParsedCommand): ObserveCase => {
    const parsedCommandName = parsedCommand?.command;
    const command = commands[parsedCommandName ?? ''] ?? noneCommand;

    if (
      parsedCommandName !== undefined &&
      commands[parsedCommandName] === undefined
    ) {
      logger.warn(`unknown command: ${parsedCommandName}`);
    }

    return (getEnv().MODE === 'MAINTENANCE' && !command.allowInMaintenance) ||
      (whiteChatsList !== undefined &&
        !whiteChatsList.includes(msg.chat.id) &&
        command.whiteListOnly)
      ? 'maintenanceMessage'
      : command;
  };

const sendMaintenanceMessageFn =
  (chatId: number, telegramBot: TelegramBotService) =>
  (msg: TelegramBot.Message) => {
    logger.info(
      `Maintenance message sent to chat ${msg.chat.id}. Message: "${msg.text}".`
    );
    catchError(telegramBot.sendMessage(chatId, t('server.maintenanceMessage')));
  };

const observeCommandsOrSendMaintenanceMessages =
  (chatId: number, services: Services) =>
  (
    chatParsedCommand$: GroupedObservable<ObserveCase, MessageAndParsedCommand>
  ) => {
    const observeCase = chatParsedCommand$.key;
    const chatCommandMessage$ = chatParsedCommand$.pipe(map(({ msg }) => msg));

    if (observeCase === 'maintenanceMessage') {
      chatCommandMessage$.subscribe(
        sendMaintenanceMessageFn(chatId, services.telegramBot)
      );
    } else {
      const controller = getCommandController(observeCase);
      controller({
        chat$: chatCommandMessage$,
        chatId,
        services,
      });
    }
  };

export default mainController;
