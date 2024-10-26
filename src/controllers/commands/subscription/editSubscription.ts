import type TelegramBot from 'node-telegram-bot-api';
import { getGroupTitle } from '../../../data/dbChatUtils.ts';
import {
  getSubscriptionExpireFormattedDate,
  getSubscriptionObjectText,
} from '../../../data/subscriptionUtils.ts';
import { getTariffRestText } from '../../../data/tariffUtils.ts';
import { required } from '../../../lib/lang.ts';
import type DbService from '../../../services/DbService.ts';
import { type SubscriptionWithTariffAndChat } from '../../../services/DbService.ts';
import type TelegramBotService from '../../../services/TelegramBotService.ts';
import { chooseTariff } from './chooseTariff.ts';
import { makeEditSubscriptionCallbackData, makeObjectCallbackData } from './tgButtonsCallbacks.ts';
import { EditSubscriptionAction } from './types/EditSubscriptionAction.ts';
import { ObjectType } from './types/ObjectType.ts';
import { ucFirst } from '../../../lib/string.ts';
import { subscribeFromGroupInstructions } from './common.ts';

export async function editSubscription({
  id,
  db,
  telegramBot,
  user,
}: {
  id: bigint;
  db: DbService;
  telegramBot: TelegramBotService;
  user: TelegramBot.User;
}): Promise<void> {
  const subscription = await db.getSubscription(id);

  const subscriptionObjectText = ucFirst(
    getSubscriptionObjectText({
      subscription,
      grammarCase: 'nom',
      addition: 'none',
    })
  );

  const tariffText = await getTariffRestText({
    db,
    telegramBot,
    userId: user.id,
    chatId: required(
      subscription.chatId ?? subscription.userId,
      'subscription chatId or userId is required'
    ),
    subscription,
    price: true,
  });

  await telegramBot.sendMessage(
    user.id,
    `${subscriptionObjectText}\n\n${tariffText}\n\nВы хотите изменить подписку?`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              // fixme cover
              text: '💼 Изменить тариф',
              callback_data: makeEditSubscriptionCallbackData(
                id,
                EditSubscriptionAction.changeTariff
              ),
            },
          ],
          [
            {
              // fixme cover
              text:
                subscription.chatId == null
                  ? '👥 Переключить на группу'
                  : '👥 Переключить на другую группу',
              callback_data: makeEditSubscriptionCallbackData(
                id,
                EditSubscriptionAction.changeGroup
              ),
            },
          ],
          subscription.userId == null && [
            {
              // fixme cover
              text: '👤 Переключить на себя',
              callback_data: makeEditSubscriptionCallbackData(
                id,
                EditSubscriptionAction.changeToMe
              ),
            },
          ],
          [
            subscription.autoRenew
              ? {
                  // fixme cover
                  text: '🚫 Отключить автопродление',
                  callback_data: makeEditSubscriptionCallbackData(
                    id,
                    EditSubscriptionAction.unsubscribe
                  ),
                }
              : {
                  // fixme cover
                  text: '🔔 Включить автопродление',
                  callback_data: makeEditSubscriptionCallbackData(
                    id,
                    EditSubscriptionAction.resubscribe
                  ),
                },
          ],
        ].filter(Boolean),
      },
    }
  );
}

export async function doEditSubscription({
  subscriptionId,
  groupId,
  action,
  db,
  telegramBot,
  user,
}: {
  subscriptionId: bigint;
  groupId: bigint | undefined;
  action: EditSubscriptionAction;
  db: DbService;
  telegramBot: TelegramBotService;
  user: TelegramBot.User;
}): Promise<void> {
  const subscription = await db.getSubscription(subscriptionId);

  switch (action) {
    case EditSubscriptionAction.changeTariff: {
      // fixme cover
      await chooseTariff({
        object: ObjectType.subscription,
        id: subscriptionId,
        db,
        telegramBot,
        user,
      });
      break;
    }
    case EditSubscriptionAction.changeGroup: {
      if (groupId == null) {
        // fixme cover
        await subscribeFromGroupInstructions(telegramBot, user.id, 'changeGroup');
      } else {
        await db.updateSubscription(subscriptionId, { chatId: groupId, userId: null });

        const chat = await db.getChat(Number(groupId));
        // fixme cover
        await telegramBot.sendMessage(
          user.id,
          `✅ Подписка переключена на группу "${getGroupTitle({
            chatId: groupId,
            chat,
            grammarCase: 'gen',
          })}"`
        );
      }
      break;
    }
    case EditSubscriptionAction.changeToMe: {
      await db.updateSubscription(subscriptionId, { chatId: null, userId: BigInt(user.id) });
      // fixme cover
      await telegramBot.sendMessage(user.id, '✅ Подписка переключена на вас');
      break;
    }
    case EditSubscriptionAction.unsubscribe: {
      // fixme cover
      await telegramBot.sendMessage(
        user.id,
        `❓ Вы уверены, что хотите отключить автопродление подписки? Подписка будет действовать до ${getSubscriptionExpireFormattedDate(
          subscription
        )}.`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  // fixme cover
                  text: 'Да, отписаться',
                  callback_data: makeEditSubscriptionCallbackData(
                    subscriptionId,
                    EditSubscriptionAction.unsubscribeConfirmed
                  ),
                },
                {
                  // fixme cover
                  text: 'Отмена',
                  callback_data: makeEditSubscriptionCallbackData(
                    subscriptionId,
                    EditSubscriptionAction.unsubscribeDeclined
                  ),
                },
              ],
            ],
          },
        }
      );
      break;
    }

    case EditSubscriptionAction.unsubscribeConfirmed: {
      await db.updateSubscription(subscriptionId, { autoRenew: false });
      // fixme cover
      await telegramBot.sendMessage(
        user.id,
        '✅ Вы успешно отключили автопродление. Вы всегда можете опять включить его введя команду /subscription в этом чате.'
      );
      break;
    }

    case EditSubscriptionAction.unsubscribeDeclined: {
      // fixme cover
      await telegramBot.sendMessage(user.id, '🚫 Действие отменено');
      await editSubscription({
        id: subscriptionId,
        db,
        telegramBot,
        user,
      });
      break;
    }

    case EditSubscriptionAction.resubscribe: {
      if (subscription.paymentMethodId == null) {
        // fixme cover
        await telegramBot.sendMessage(
          user.id,
          '😔 К сожалению, вы не отметили опцию `Разрешаю автосписания` при оплате подписки. Для того, чтобы включить автопродление вам нужно дождаться истечения текущей подписки и после этого оформить новую подписку. Когда будете оформлять новую подписку обязательно отметьте опцию `Разрешаю автосписания` во время оплаты. Я напомню вам об этом когда текущая подписка закончится.'
        );
      } else {
        await db.updateSubscription(subscriptionId, { autoRenew: true });
        // fixme cover
        await telegramBot.sendMessage(
          user.id,
          `✅ Автопродление подписки возобновлено. Следующее списание произойдет ${getSubscriptionExpireFormattedDate(
            subscription
          )}.`
        );
      }
      break;
    }
  }
}

export async function chooseSubscriptionToChange({
  telegramBot,
  user,
  groupId,
  userSubscription,
  groupsSubscriptions,
  db,
}: {
  telegramBot: TelegramBotService;
  user: TelegramBot.User;
  groupId: bigint;
  userSubscription: SubscriptionWithTariffAndChat | undefined;
  groupsSubscriptions: SubscriptionWithTariffAndChat[];
  db: DbService;
}): Promise<void> {
  const chat = await db.getChat(Number(groupId));

  // fixme cover
  await telegramBot.sendMessage(
    user.id,
    `${getGroupTitle({
      chatId: groupId,
      chat,
      grammarCase: 'nom',
    })}\n\nВы хотите оплатить новую подписку или перевести существующую на эту группу?`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              // fixme cover
              text: 'Оплатить новую подписку',
              callback_data: makeObjectCallbackData(ObjectType.group, groupId),
            },
          ],
          userSubscription && [
            {
              // fixme cover
              text: 'Переключить подписку с себя на эту группу',
              callback_data: makeEditSubscriptionCallbackData(
                userSubscription.id,
                EditSubscriptionAction.changeGroup,
                groupId
              ),
            },
          ],
          groupsSubscriptions.map((s) => ({
            // fixme cover
            text: `Переключить подписку с "${getGroupTitle({
              chatId: required(s.chatId, 'chatId is required'),
              chat: s.chat,
              grammarCase: 'gen',
            })}" на эту группу`,
            callback_data: makeEditSubscriptionCallbackData(
              s.id,
              EditSubscriptionAction.changeGroup,
              groupId
            ),
          })),
        ].filter(Boolean),
      },
    }
  );
}
