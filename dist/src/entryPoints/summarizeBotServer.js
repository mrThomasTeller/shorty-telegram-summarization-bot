import { Observable, filter, groupBy, pipe, } from 'rxjs';
import mainController from '../controllers/mainController.js';
import { getRealCommands } from '../config/commands/index.js';
import _ from 'lodash';
import logger from '../config/logger.js';
import { sendHelpMessage } from '../controllers/commands/helpCommandController.js';
import { catchError } from '../lib/async.js';
// todo refactor this function
const summarizeBotServer = async (services) => {
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
function createTgMessagesObservable(telegramBotService) {
    return new Observable((subscriber) => telegramBotService.onAnyMessage((msg) => {
        subscriber.next(msg);
    }));
}
const observeChatWithMainController = _.curry((services, chat$) => {
    mainController({ chat$, chatId: chat$.key, services });
});
const groupNonEmptyMessagesByChatId = pipe(filter((msg) => msg.text != null), groupBy((msg) => msg.chat.id));
