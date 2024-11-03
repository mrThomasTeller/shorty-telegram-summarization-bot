import { type User } from 'node-telegram-bot-api';
import type DbService from '../../../services/DbService';
import type TelegramBotService from '../../../services/TelegramBotService';
import { ObjectType } from './types/ObjectType';

export async function checkAccessToObject({
  db,
  telegramBot,
  user,
  object,
  id,
}: {
  db: DbService;
  telegramBot: TelegramBotService;
  user: User;
  object: ObjectType;
  id: bigint;
}): Promise<void> {
  switch (object) {
    case ObjectType.user: {
      if (user.id !== Number(id)) {
        throw new Error(`User ${user.id} tries to access another user (${id}) subscription`);
      }
      break;
    }
    case ObjectType.group: {
      const [isInChat, admins] = await Promise.all([
        telegramBot.isInChat(Number(id)),
        telegramBot.getChatAdministrators(Number(id)),
      ]);

      if (!isInChat || !admins.some((admin) => admin.user.id === user.id)) {
        throw new Error(
          `User ${user.id} does not have access to group ${id} or Shorty is not a member of group`
        );
      }
      break;
    }
    case ObjectType.subscription: {
      const subscription = await db.getSubscription(id);
      if (subscription.subscriberUserId !== BigInt(user.id)) {
        throw new Error(
          `User ${user.id} tries to access another user subscription (${subscription.id})`
        );
      }
      break;
    }
  }
}
