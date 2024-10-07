import type TelegramBot from 'node-telegram-bot-api';
import { getGroupTitle } from '../../../data/dbChatUtils.ts';
import { getSubscriptionObjectText } from '../../../data/subscriptionUtils.ts';
import { getTariffText } from '../../../data/tariffUtils.ts';
import { required } from '../../../lib/lang.ts';
import type DbService from '../../../services/DbService.ts';
import { type SubscriptionWithTariffAndChat } from '../../../services/DbService.ts';
import type TelegramBotService from '../../../services/TelegramBotService.ts';
import { chooseTariff } from './chooseTariff.ts';
import { makeEditSubscriptionCallbackData, makeObjectCallbackData } from './tgButtonsCallbacks.ts';
import { EditSubscriptionAction } from './types/EditSubscriptionAction.ts';
import { ObjectType } from './types/ObjectType.ts';

export async function editSubscription({
  object,
  id,
  db,
  telegramBot,
  user,
}: {
  object: ObjectType;
  id: bigint;
  db: DbService;
  telegramBot: TelegramBotService;
  user: TelegramBot.User;
}): Promise<void> {
  if (object === ObjectType.subscription) {
    const subscription = await db.getSubscription(id);

    const tariffText = await getTariffText({
      db,
      telegramBot,
      userId: user.id,
      chatId: required(
        subscription.chatId ?? subscription.userId,
        'subscription chatId or userId is required'
      ),
      subscription,
    });

    const subscriptionObjectText = getSubscriptionObjectText(subscription);

    // todo 2sub кнопка назад
    await telegramBot.sendMessage(
      user.id,
      `${subscriptionObjectText}\n\n${tariffText}\n\nВы хотите изменить подписку?`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Изменить тариф',
                callback_data: makeEditSubscriptionCallbackData(
                  id,
                  EditSubscriptionAction.changeTariff
                ),
              },
            ],
            [
              {
                text: 'Переключить на другой групповой чат',
                callback_data: makeEditSubscriptionCallbackData(
                  id,
                  EditSubscriptionAction.changeGroup
                ),
              },
            ],
            subscription.userId == null && [
              {
                text: 'Переключить на себя',
                callback_data: makeEditSubscriptionCallbackData(
                  id,
                  EditSubscriptionAction.changeToMe
                ),
              },
            ],
            [
              subscription.autoRenew
                ? {
                    text: 'Отписаться',
                    callback_data: makeEditSubscriptionCallbackData(
                      id,
                      EditSubscriptionAction.unsubscribe
                    ),
                  }
                : {
                    text: 'Включить автопродление подписки',
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
  } else {
    await chooseTariff({
      object,
      id,
      db,
      telegramBot,
      user,
    });
  }
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
        const botName = await telegramBot.getUsername();
        await telegramBot.sendMessage(
          user.id,
          `Для того, чтобы переключить подписку на новую группу:
1️⃣ Добавьте меня в эту новую группу
2️⃣ В новой группе отправьте команду \`/subscription@${botName}\``
        );
      } else {
        await db.updateSubscription(subscriptionId, { chatId: groupId, userId: null });
        await telegramBot.sendMessage(user.id, '✅ Подписка переключена на группу'); // todo sub какую группу? инструкции
      }
      break;
    }
    case EditSubscriptionAction.changeToMe: {
      await db.updateSubscription(subscriptionId, { chatId: null, userId: BigInt(user.id) });
      await telegramBot.sendMessage(user.id, '✅ Подписка переключена на вас'); // todo sub инструкции
      break;
    }
    case EditSubscriptionAction.unsubscribe: {
      // todo sub до какого ещё будет действовать подписка?
      await telegramBot.sendMessage(user.id, '❓ Вы уверены, что хотите отписаться?', {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Да, отписаться',
                callback_data: makeEditSubscriptionCallbackData(
                  subscriptionId,
                  EditSubscriptionAction.unsubscribeConfirmed
                ),
              },
              {
                text: 'Отмена',
                callback_data: makeEditSubscriptionCallbackData(
                  subscriptionId,
                  EditSubscriptionAction.unsubscribeDeclined
                ),
              },
            ],
          ],
        },
      });
      break;
    }

    case EditSubscriptionAction.unsubscribeConfirmed: {
      await db.updateSubscription(subscriptionId, { autoRenew: false });
      await telegramBot.sendMessage(user.id, '✅ Вы успешно отписались');
      // todo sub до какого числа действует подписка? Как подписаться заново?
      break;
    }

    case EditSubscriptionAction.unsubscribeDeclined: {
      await telegramBot.sendMessage(user.id, '❕ Действие отменено');
      await editSubscription({
        object: ObjectType.subscription,
        id: subscriptionId,
        db,
        telegramBot,
        user,
      });
      break;
    }

    case EditSubscriptionAction.resubscribe: {
      if (subscription.paymentMethodId == null) {
        // todo sub нужно будет подписаться после истечения подписки
      } else {
        await db.updateSubscription(subscriptionId, { autoRenew: true });
        await telegramBot.sendMessage(user.id, '✅ Автопродление подписки включено'); // todo sub когда и какой будет следующий платё��?
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

  await telegramBot.sendMessage(
    user.id,
    `${getGroupTitle(
      groupId,
      chat,
      'nom'
    )}\n\nВы хотите оплатить новую подписку или перевести существующую на эту группу?`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Оплатить новую подписку',
              callback_data: makeObjectCallbackData(ObjectType.group, groupId),
            },
          ],
          userSubscription && [
            {
              text: 'Переключить подписку с себя на эту группу',
              callback_data: makeEditSubscriptionCallbackData(
                userSubscription.id,
                EditSubscriptionAction.changeGroup,
                groupId
              ),
            },
          ],
          groupsSubscriptions.map((s) => ({
            text: `Переключить подписку с "${getGroupTitle(
              required(s.chatId, 'chatId is required'),
              s.chat,
              'gen'
            )}" на эту группу`,
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
