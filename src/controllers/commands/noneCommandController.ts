import type TelegramBot from 'node-telegram-bot-api';
import type ChatController from '../ChatController.ts';
import { rejectAsync } from '../../lib/rxOperators.ts';
import { catchError } from '../../lib/async.ts';
import type DbService from '../../services/DbService.ts';
import {
  convertTgMessageToDbMessageInput,
  convertTgUserToDbUserInput,
} from '../../data/convertors.ts';
import logger from '../../config/logger.ts';

const noneCommandController: ChatController = ({ chat$, chatId, services }) => {
  chat$
    .pipe(rejectAsync((msg) => services.db.hasMessage(msg.message_id, chatId)))
    .subscribe((msg) => {
      catchError(addMessageToDb(msg, services.db));
    });
};

export default noneCommandController;

async function addMessageToDb(msg: TelegramBot.Message, db: DbService): Promise<void> {
  const userCreationResult =
    msg.from && (await db.getOrCreateUser(convertTgUserToDbUserInput(msg.from)));
  const user = userCreationResult?.[0];

  const [chat, created] = await db.getOrCreateChat(msg.chat.id);
  if (created) {
    logger.info(`New chat created: ${msg.chat.id}`);
  }

  await db.createChatMessageIfNotExists(convertTgMessageToDbMessageInput(msg, chat, user));
}
