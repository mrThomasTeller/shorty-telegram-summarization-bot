import { type User } from 'node-telegram-bot-api';
import type DbService from '../../../services/DbService';
import type TelegramBotService from '../../../services/TelegramBotService';
import { ObjectType } from './types/ObjectType';
import { helpKeyboardButton } from './help';

// todo 2sub пользователю потом придётся заново выбирать группу с которой переключить подписку
// надо упростить этот процесс
export async function subscribeFromGroupInstructions(
  telegramBot: TelegramBotService,
  userId: number,
  action: 'subscribe' | 'changeGroup'
): Promise<void> {
  const botName = await telegramBot.getUsername();
  await telegramBot.sendMessage(
    userId,
    `👉 Для того, чтобы ${
      action === 'subscribe' ? 'оформить подписку' : 'переключить подписку'
    } на новую группу:

1️⃣ Скопируйте эту команду \\(кликните по ней, чтобы скопировать\\):
\`/subscription@${botName}\`

2️⃣ Добавьте меня в новую группу если ещё этого не сделали \\(можно нажать на кнопку ниже\\)

3️⃣ В новой группе отправьте скопированную на первом шаге команду

4️⃣ Нажмите на кнопку "⭐️ Оформить подписку"`,
    {
      parse_mode: 'MarkdownV2',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Добавить в групповой чат',
              url: `https://t.me/${botName}?startgroup=true`,
            },
          ],
          helpKeyboardButton(botName),
        ],
      },
    }
  );
}

export async function checkAccessToObject({
  db,
  user,
  object,
  id,
}: {
  db: DbService;
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
      const userGroups = await db.getUserChats(user.id);
      if (!userGroups.some((g) => g.id === id)) {
        throw new Error(`User ${user.id} does not have access to group ${id}`);
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
