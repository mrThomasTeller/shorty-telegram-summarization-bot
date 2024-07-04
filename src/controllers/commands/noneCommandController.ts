import { type Chat } from '@prisma/client';
import type TelegramBot from 'node-telegram-bot-api';
import logger from '../../config/logger.ts';
import {
  convertTgMessageToDbMessageInput,
  convertTgUserToDbUserInput,
} from '../../data/convertors.ts';
import { getFormattedMessage } from '../../data/dbChatMessageUtils.ts';
import { getMaxTextToSummarizeApproximateLength } from '../../data/tariffUtils.ts';
import { chatSettingsSchema } from '../../data/types/ChatSettings.ts';
import type DbChatMessage from '../../data/types/DbChatMessage.ts';
import { rejectAsync } from '../../lib/rxOperators.ts';
import type DbService from '../../services/DbService.ts';
import type ChatController from '../ChatController.ts';

const noneCommandController: ChatController = ({ chat$, chatId, services }) => {
  chat$
    .pipe(rejectAsync((msg) => services.db.hasMessage(msg.message_id, chatId)))
    .subscribe(async (msg) => {
      try {
        const { chat } = await addMessageToDb(msg, services.db);

        const settings = chatSettingsSchema.parse(chat.settings);
        if (settings.notifyItsTimeToSummarize === true && !chat.notifiedItsTimeToSummarize) {
          const subscription = await services.db.getSubscription(chatId, msg.from?.id);
          const maxTextToSummarizeApproximateLength = getMaxTextToSummarizeApproximateLength(
            subscription?.tariff
          );

          if (chat.unsummarizedSymbols >= maxTextToSummarizeApproximateLength * 0.9) {
            await services.telegramBot.sendMessage(
              msg.chat.id,
              `⚠️ В вашем чате накопилось уже много сообщений, пора делать выжимку! 😉 Нажмите сюда: /summarize@${await services.telegramBot.getUsername()}`
            );

            await services.db.updateChat(msg.chat.id, { notifiedItsTimeToSummarize: true });
          }
        }
      } catch (error) {
        logger.error('Error in noneCommandController', error);
      }
    });
};

export default noneCommandController;

async function addMessageToDb(
  msg: TelegramBot.Message,
  db: DbService
): Promise<{ chat: Chat; message: DbChatMessage }> {
  const userCreationResult =
    msg.from && (await db.getOrCreateUser(convertTgUserToDbUserInput(msg.from)));
  const user = userCreationResult?.[0];

  const { chat, created: chatCreated } = await db.getOrCreateChat(msg.chat.id);
  if (chatCreated) {
    logger.info(`New chat created: ${msg.chat.id}`);
  }

  const message = await db.createChatMessage(convertTgMessageToDbMessageInput(msg, chat, user));

  const formattedMessage = getFormattedMessage(message);
  if (formattedMessage != null && formattedMessage.length > 0) {
    const newUnsummarizedSymbols = chat.unsummarizedSymbols + formattedMessage.length;
    await db.updateChat(msg.chat.id, { unsummarizedSymbols: newUnsummarizedSymbols });
    chat.unsummarizedSymbols = newUnsummarizedSymbols;
  }

  return { chat, message };
}
