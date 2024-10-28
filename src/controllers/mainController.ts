import type TelegramBot from 'node-telegram-bot-api';
import { type GroupedObservable, groupBy, map, mergeMap } from 'rxjs';
import type Command from '../config/commands/Command';
import commands from '../config/commands/index';
import noneCommand from '../config/commands/none';
import { getEnv, getWhiteChatsList } from '../config/envVars';
import logger from '../config/logger';
import { t } from '../config/translations/index';
import { convertTgUserToDbUserInput } from '../data/convertors';
import { encryptIfExists } from '../data/encryption';
import { type ParsedCommand, isCommandForBot, parseCommand } from '../data/telegramBotMessageUtils';
import { blockedMessagesService } from '../lib/BlockedMessagesService';
import { catchError } from '../lib/common/async';
import { required } from '../lib/common/lang';
import { filterAsync } from '../lib/common/rxOperators';
import type Services from '../services/Services';
import type TelegramBotService from '../services/TelegramBotService';
import type ChatController from './ChatController';
import getCommandController from './commands/getCommandController';

type ObserveCase = {
  command: Command;
  case: 'command' | 'maintenanceMessage' | 'privateChatOnly';
};

type MessageAndParsedCommand = {
  msg: TelegramBot.Message;
  parsedCommand: ParsedCommand | undefined;
};

const mainController: ChatController = ({ chat$, chatId, services }) => {
  const whiteChatsList = getWhiteChatsList();

  chat$
    .pipe(
      map(getParsedOrBlockedCommand),
      filterAsync(messageHasCommandForBot(services.telegramBot)),
      groupBy(getObserveCaseForMessage(whiteChatsList))
    )
    .subscribe(observeCommandsOrSendMaintenanceMessages(chatId, services));
};

function getParsedOrBlockedCommand(msg: TelegramBot.Message): MessageAndParsedCommand {
  const result = { msg, parsedCommand: parseCommand(msg) };

  if (result.parsedCommand?.command === 'start') {
    const blockedMessage = blockedMessagesService.pop(msg.chat.id);
    if (blockedMessage != null) {
      return { msg: blockedMessage, parsedCommand: parseCommand(blockedMessage) };
    }
  }

  return result;
}

// todo забыл зачем это надо...
const messageHasCommandForBot =
  (telegramBot: TelegramBotService) =>
  async ({ msg, parsedCommand }: MessageAndParsedCommand): Promise<boolean> => {
    const botName = required(await telegramBot.getUsername());
    return parsedCommand === undefined || isCommandForBot(parsedCommand, msg, botName);
  };

const getObserveCaseForMessage =
  (whiteChatsList: number[] | undefined) =>
  ({ msg, parsedCommand }: MessageAndParsedCommand): ObserveCase => {
    const parsedCommandName = parsedCommand?.command;
    const command = commands[parsedCommandName ?? ''] ?? noneCommand;

    if (parsedCommandName !== undefined && commands[parsedCommandName] === undefined) {
      logger.warn(`unknown command: ${parsedCommandName}`);
    }

    if (getEnv().MODE === 'MAINTENANCE' && command.allowInMaintenance !== true)
      return { case: 'maintenanceMessage', command };

    if (command.privateChatOnly === true && msg.chat.type !== 'private')
      return { case: 'privateChatOnly', command };

    if (
      whiteChatsList !== undefined &&
      !whiteChatsList.includes(msg.chat.id) &&
      command.ignoreWhiteList !== true
    )
      return { case: 'maintenanceMessage', command };

    return { case: 'command', command };
  };

const sendMaintenanceMessageFn =
  (chatId: number, telegramBot: TelegramBotService) => (msg: TelegramBot.Message) => {
    logger.info(`Maintenance message sent to chat ${msg.chat.id}. Message: "${msg.text}".`);
    catchError(
      telegramBot.sendMessage(
        chatId,
        getEnv().MAINTENANCE_MESSAGE ?? t('server.maintenanceMessage')
      )
    );
  };

const sendPrivateChatOnlyMessageFn =
  (chatId: number, telegramBot: TelegramBotService) => async () => {
    const botName = required(await telegramBot.getUsername());

    await telegramBot.sendMessage(chatId, t('server.privateChatOnly', { botName }));
  };

const observeCommandsOrSendMaintenanceMessages =
  (chatId: number, services: Services) =>
  (chatParsedCommand$: GroupedObservable<ObserveCase, MessageAndParsedCommand>) => {
    const observeCase = chatParsedCommand$.key;
    const chatCommandMessage$ = chatParsedCommand$.pipe(
      mergeMap(async ({ msg }) => {
        if (msg.from) {
          await services.db.getOrCreateUser(convertTgUserToDbUserInput(msg.from));
        }

        await services.db.upsertChat(msg.chat.id, encryptIfExists(msg.chat.title));

        return msg;
      })
    );

    if (observeCase.case === 'maintenanceMessage') {
      chatCommandMessage$.subscribe(sendMaintenanceMessageFn(chatId, services.telegramBot));
    } else if (observeCase.case === 'privateChatOnly') {
      chatCommandMessage$.subscribe(sendPrivateChatOnlyMessageFn(chatId, services.telegramBot));
    } else {
      const controller = getCommandController(observeCase.command);
      controller({
        chat$: chatCommandMessage$,
        chatId,
        services,
      });
    }
  };

export default mainController;
