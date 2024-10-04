import type TelegramBot from 'node-telegram-bot-api';
import { decryptIfExists } from '../../../data/encryption.ts';
import { type SubscriptionWithTariffAndChat } from '../../../services/DbService.ts';
import type TelegramBotService from '../../../services/TelegramBotService.ts';
import { makeObjectCallbackData } from './tgButtonsCallbacks.ts';
import { ObjectType } from './types/ObjectType.ts';

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
  // todo sub text
  await telegramBot.sendMessage(
    user.id,
    `Вы хотите активировать премиум на себя или на групповой чат?

Если на себя: то вы сможете делать краткие выжимки в любом чате (в котором есть Shorty).
Если на групповой чат: то любой участник этого чата сможет делать краткие выжимки.`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            userSubscription
              ? {
                  text: 'Редактировать подписку на себя',
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
              text: 'Оформить новую подписку на групповой чат',
              callback_data: makeObjectCallbackData(ObjectType.group, 0),
            },
          ],
          groupsSubscriptions.map((s) => ({
            text: `Редактировать подписку на "${
              decryptIfExists(s.chat?.title) ?? 'групповой чат ' + s.chatId
            }"`,
            callback_data: makeObjectCallbackData(ObjectType.subscription, s.id),
          })),
        ],
      },
    }
  );
}
