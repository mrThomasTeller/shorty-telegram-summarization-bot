import { groupBy, map } from 'rxjs';
import { getEnv, getWhiteChatsList } from '../config/envVars.js';
import { isCommandForBot, parseCommand, } from '../data/telegramBotMessageUtils.js';
import { required } from '../lib/common.js';
import commands from '../config/commands/index.js';
import getCommandController from './commands/getCommandController.js';
import { t } from '../config/translations/index.js';
import { catchError } from '../lib/async.js';
import { filterAsync } from '../lib/rxOperators.js';
import logger from '../config/logger.js';
import noneCommand from '../config/commands/none.js';
const mainController = ({ chat$, chatId, services }) => {
    const whiteChatsList = getWhiteChatsList();
    chat$
        .pipe(map((msg) => ({
        msg,
        parsedCommand: parseCommand(msg),
    })), filterAsync(messageHasCommandForBot(services.telegramBot)), groupBy(getObserveCaseForMessage(whiteChatsList)))
        .subscribe(observeCommandsOrSendMaintenanceMessages(chatId, services));
};
const messageHasCommandForBot = (telegramBot) => async ({ msg, parsedCommand }) => {
    const botName = required(await telegramBot.getUsername());
    return (parsedCommand === undefined ||
        isCommandForBot(parsedCommand, msg, botName));
};
const getObserveCaseForMessage = (whiteChatsList) => ({ msg, parsedCommand }) => {
    const parsedCommandName = parsedCommand?.command;
    const command = commands[parsedCommandName ?? ''] ?? noneCommand;
    if (parsedCommandName !== undefined &&
        commands[parsedCommandName] === undefined) {
        logger.warn(`unknown command: ${parsedCommandName}`);
    }
    return (getEnv().MODE === 'MAINTENANCE' && !command.allowInMaintenance) ||
        (whiteChatsList !== undefined &&
            !whiteChatsList.includes(msg.chat.id) &&
            command.whiteListOnly)
        ? 'maintenanceMessage'
        : command;
};
const sendMaintenanceMessageFn = (chatId, telegramBot) => (msg) => {
    logger.info(`Maintenance message sent to chat ${msg.chat.id}. Message: "${msg.text}".`);
    catchError(telegramBot.sendMessage(chatId, t('server.maintenanceMessage')));
};
const observeCommandsOrSendMaintenanceMessages = (chatId, services) => (chatParsedCommand$) => {
    const observeCase = chatParsedCommand$.key;
    const chatCommandMessage$ = chatParsedCommand$.pipe(map(({ msg }) => msg));
    if (observeCase === 'maintenanceMessage') {
        chatCommandMessage$.subscribe(sendMaintenanceMessageFn(chatId, services.telegramBot));
    }
    else {
        const controller = getCommandController(observeCase);
        controller({
            chat$: chatCommandMessage$,
            chatId,
            services,
        });
    }
};
export default mainController;
