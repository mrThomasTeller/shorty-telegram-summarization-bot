/* eslint-disable max-lines */
import type TelegramBot from 'node-telegram-bot-api';
import {
  getSubscriptionExpireFormattedDate,
  getSubscriptionExpiresText,
  getSubscriptionObjectText,
  isSubscriptionActive,
} from '../../../data/subscriptionUtils';
import { getTariffRestText } from '../../../data/tariffUtils';
import { required } from '../../../lib/common/lang';
import { ucFirst } from '../../../lib/common/string';
import type DbService from '../../../services/DbService';
import type TelegramBotService from '../../../services/TelegramBotService';
import { chooseTariff } from './chooseTariff';
import { checkAccessToObject } from './common';
import { makeEditSubscriptionUrl } from './routing';
import { EditSubscriptionAction } from './types/EditSubscriptionAction';
import { ObjectType } from './types/ObjectType';

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
  await checkAccessToObject({ db, user, object: ObjectType.subscription, id });
  const subscription = await db.getSubscription(id);

  const individualSubscription = await db.getUserSubscription(user.id);
  const hasIndividualSubscription =
    individualSubscription != null && isSubscriptionActive(individualSubscription);

  const subscriptionObjectText = ucFirst(
    getSubscriptionObjectText({
      subscription,
      grammarCase: 'nom',
      tariffText: 'none',
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

  const botName = await telegramBot.getUsername();

  await telegramBot.sendMessage(
    user.id,
    `${subscriptionObjectText}\n\n${tariffText}\n\nВы хотите изменить подписку?`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '💼 Изменить/обновить тариф',
              url: makeEditSubscriptionUrl({
                botName,
                subscriptionId: id,
                action: EditSubscriptionAction.changeTariff,
              }),
            },
          ],
          [
            {
              text:
                subscription.chatId == null
                  ? '👥 Переключить на группу'
                  : '👥 Переключить на другую группу',
              url: makeEditSubscriptionUrl({
                botName,
                subscriptionId: id,
                action: EditSubscriptionAction.changeGroup,
              }),
            },
          ],
          subscription.userId == null &&
            !hasIndividualSubscription && [
              {
                text: '👤 Переключить на себя',
                url: makeEditSubscriptionUrl({
                  botName,
                  subscriptionId: id,
                  action: EditSubscriptionAction.changeToMe,
                }),
              },
            ],
          [
            subscription.paymentMethodId == null
              ? {
                  text: '🔔 Включить автопродление',
                  url: makeEditSubscriptionUrl({
                    botName,
                    subscriptionId: id,
                    action: EditSubscriptionAction.resubscribe,
                  }),
                }
              : {
                  text: '🚫 Отключить автопродление',
                  url: makeEditSubscriptionUrl({
                    botName,
                    subscriptionId: id,
                    action: EditSubscriptionAction.unsubscribe,
                  }),
                },
          ],
        ].filter(Boolean),
      },
    }
  );
}

export async function doEditSubscription({
  subscriptionId,
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
  await checkAccessToObject({ db, user, object: ObjectType.subscription, id: subscriptionId });

  switch (action) {
    case EditSubscriptionAction.changeTariff: {
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
      await telegramBot.sendMessage(
        user.id,
        `😔 В данный момент это невозможно сделать автоматически. Пожалуйста, обратитесь в поддержку: @shorty_support_bot`
      );
      // if (groupId == null) {
      //   await subscribeFromGroupInstructions(telegramBot, user.id, 'changeGroup');
      // } else {
      //   await db.updateSubscription(subscriptionId, { chatId: groupId, userId: null });

      //   const chat = await db.getChat(Number(groupId));
      //   await telegramBot.sendMessage(
      //     user.id,
      //     `✅ Подписка переключена на группу "${getGroupTitle({
      //       chatId: groupId,
      //       chat,
      //       grammarCase: 'gen',
      //     })}"`
      //   );
      // }
      break;
    }

    // fixme tsub спросить, точно ли?
    case EditSubscriptionAction.changeToMe: {
      await db.updateSubscription(subscriptionId, { chatId: null, userId: BigInt(user.id) });
      await telegramBot.sendMessage(user.id, '✅ Подписка переключена на вас');
      break;
    }

    case EditSubscriptionAction.unsubscribe: {
      const botName = await telegramBot.getUsername();
      await telegramBot.sendMessage(
        user.id,
        `❓ Вы уверены, что хотите отключить автопродление подписки? Если захотите включить его снова вам нужно будет дождаться истечения текущей подписки и после этого оформить новую. Текущая подписка действует до ${getSubscriptionExpireFormattedDate(
          subscription
        )}.`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: 'Да, отключить',
                  url: makeEditSubscriptionUrl({
                    botName,
                    subscriptionId,
                    action: EditSubscriptionAction.unsubscribeConfirmed,
                  }),
                },
                {
                  text: 'Отмена',
                  url: makeEditSubscriptionUrl({
                    botName,
                    subscriptionId,
                    action: EditSubscriptionAction.unsubscribeDeclined,
                  }),
                },
              ],
            ],
          },
        }
      );
      break;
    }

    case EditSubscriptionAction.unsubscribeConfirmed: {
      await db.updateSubscription(subscriptionId, {
        triesToRenew: 0,
        deactivated: false,
        paymentMethodId: null,
        expires: subscription.deactivated ? new Date() : subscription.expires,
        disableSubscriptionCheck: !subscription.deactivated,
      });
      await telegramBot.sendMessage(user.id, '✅ Вы успешно отключили автопродление подписки');
      break;
    }

    case EditSubscriptionAction.unsubscribeDeclined: {
      await telegramBot.sendMessage(user.id, '🚫 Действие отменено');
      break;
    }

    case EditSubscriptionAction.resubscribe: {
      await telegramBot.sendMessage(
        user.id,
        `👉 Для того, чтобы включить автопродление вам нужно дождаться истечения текущей подписки и после этого оформить новую

⏰  ${getSubscriptionExpiresText(subscription)}. Я напомню вам когда она закончится.`
      );
      break;
    }
  }
}

// export async function chooseSubscriptionToChange({
//   telegramBot,
//   user,
//   groupId,
//   userSubscription,
//   groupsSubscriptions,
//   db,
// }: {
//   telegramBot: TelegramBotService;
//   user: TelegramBot.User;
//   groupId: bigint;
//   userSubscription: SubscriptionWithTariffAndChat | undefined;
//   groupsSubscriptions: SubscriptionWithTariffAndChat[];
//   db: DbService;
// }): Promise<void> {
//   const chat = await db.getChat(Number(groupId));
//   const botName = await telegramBot.getUsername();
//   await telegramBot.sendMessage(
//     user.id,
//     `${getGroupTitle({
//       chatId: groupId,
//       chat,
//       grammarCase: 'nom',
//     })}\n\nВы хотите оплатить новую подписку или перевести существующую на эту группу?`,
//     {
//       reply_markup: {
//         inline_keyboard: [
//           [
//             {
//               text: 'Оплатить новую подписку',
//               url: makeObjectUrl({ botName, object: ObjectType.group, id: groupId }),
//             },
//           ],
//           userSubscription && [
//             {
//               text: 'Переключить подписку с себя на эту группу',
//               url: makeEditSubscriptionUrl({
//                 botName,
//                 subscriptionId: userSubscription.id,
//                 action: EditSubscriptionAction.changeGroup,
//                 groupId,
//               }),
//             },
//           ],
//           groupsSubscriptions.map((s) => ({
//             text: `Переключить подписку с "${getGroupTitle({
//               chatId: required(s.chatId, 'chatId is required'),
//               chat: s.chat,
//               grammarCase: 'gen',
//             })}" на эту группу`,
//             url: makeEditSubscriptionUrl({
//               botName,
//               subscriptionId: s.id,
//               action: EditSubscriptionAction.changeGroup,
//               groupId,
//             }),
//           })),
//         ].filter(Boolean),
//       },
//     }
//   );
// }
