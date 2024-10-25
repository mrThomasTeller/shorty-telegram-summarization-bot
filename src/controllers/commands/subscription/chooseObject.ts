import type TelegramBot from 'node-telegram-bot-api';
import { getSubscriptionObjectText } from '../../../data/subscriptionUtils.ts';
import { type SubscriptionWithTariffAndChat } from '../../../services/DbService.ts';
import type TelegramBotService from '../../../services/TelegramBotService.ts';
import { makeObjectCallbackData } from './tgButtonsCallbacks.ts';
import { ObjectType } from './types/ObjectType.ts';
import { ucFirst } from '../../../lib/string.ts';

export async function chooseObject({
  userSubscription,
  groupsSubscriptions,
  telegramBot,
  user,
}: {
  userSubscription: SubscriptionWithTariffAndChat | undefined;
  groupsSubscriptions: SubscriptionWithTariffAndChat[];
  telegramBot: TelegramBotService;
  user: TelegramBot.User;
}): Promise<void> {
  await telegramBot.sendMessage(
    user.id,
    `Здесь вы можете:
1️⃣ Оформить новую подписку
2️⃣ Просмотреть информацию о существующей подписке
3️⃣ Отредактировать существующую подписку (изменить тариф, группу, отписаться или подписаться заново)

👉 При оформлении подписки на себя вы сможете делать краткие выжимки в любом чате (в котором есть Shorty)

👉 При оформлении подписки на группу любой участник этого чата сможет делать краткие выжимки`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            userSubscription
              ? {
                  // fixme cover
                  text: ucFirst(getSubscriptionObjectText(userSubscription, true)),
                  callback_data: makeObjectCallbackData(
                    ObjectType.subscription,
                    userSubscription.id
                  ),
                }
              : {
                  text: 'Оформить подписку на себя',
                  callback_data: makeObjectCallbackData(ObjectType.user, user.id),
                },
          ],
          [
            {
              // fixme cover
              text: 'Оформить новую подписку на группу',
              callback_data: makeObjectCallbackData(ObjectType.group, 0),
            },
          ],
          // fixme cover add
          // fixme cover change
          groupsSubscriptions.map((s) => ({
            text: ucFirst(getSubscriptionObjectText(s, true)),
            callback_data: makeObjectCallbackData(ObjectType.subscription, s.id),
          })),
        ],
      },
    }
  );
}
