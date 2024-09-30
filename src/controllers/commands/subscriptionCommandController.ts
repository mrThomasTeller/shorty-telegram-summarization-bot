/* eslint-disable max-lines */
import type TelegramBot from 'node-telegram-bot-api';
import { type CallbackQuery } from 'node-telegram-bot-api';
import { getEnv } from '../../config/envVars.ts';
import logger from '../../config/logger.ts';
import {
  escapeTelegramMarkdown as esc,
  getCommandParams,
} from '../../data/telegramBotMessageUtils.ts';
import type DbService from '../../services/DbService.ts';
import type TelegramBotService from '../../services/TelegramBotService.ts';
import { type UKassaPaymentWebhook } from '../../services/UKassaService/UKassaPaymentWebhook.ts';
import { ukassaService } from '../../services/UKassaService/UKassaService.ts';
import type ChatController from '../ChatController.ts';
import { required, toBigInt } from '../../lib/lang.ts';
import { PaymentProvider } from '@prisma/client';
import { addMonths } from 'date-fns';
import { isSubscriptionActive } from '../../data/subscriptionUtils.ts';
import { decryptIfExists } from '../../data/encryption.ts';
import { type SubscriptionWithTariffAndChat } from '../../services/DbService.ts';

let key = 0;

type UkassaWebhookMetadata = {
  object: ObjectType;
  id: bigint;
  tariffId: string;
  userId: number;
  username: string | undefined;
  secret: string;
};

enum ObjectType {
  user = 'u',
  group = 'g',
  subscription = 's',
}

const objectCallbackKey = `subscription_${++key}`;
const makeObjectCallbackData = (object: ObjectType, id: number | bigint): string =>
  `${objectCallbackKey}/${object}/${id}`;
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const parseObjectCallbackData = (data: string) => ({
  object: required(data.split('/')[1] as ObjectType, 'object is required in callback data'),
  id: BigInt(required(data.split('/')[2], 'id is required in callback data')),
});

const tariffCallbackKey = `subscription_${++key}`;
const makeTariffCallbackData = (
  object: ObjectType,
  id: number | bigint,
  tariffId: string
): string => `${tariffCallbackKey}/${object}/${id}/${tariffId}`;
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const parseTariffCallbackData = (data: string) => ({
  object: required(data.split('/')[1] as ObjectType, 'object is required in callback data'),
  id: BigInt(required(data.split('/')[2], 'id is required in callback data')),
  tariffId: required(data.split('/')[3], 'tariffId is required in callback data'),
});

enum EditSubscriptionAction {
  changeTariff = 't',
  changeGroup = 'g',
  changeToMe = 'm',
  unsubscribe = 'u',
  unsubscribeConfirmed = 'uc',
  unsubscribeDeclined = 'ud',
}

const editSubscriptionCallbackKey = `subscription_${++key}`;
const makeEditSubscriptionCallbackData = (
  subscriptionId: bigint,
  action: EditSubscriptionAction,
  groupId?: bigint
): string => `${editSubscriptionCallbackKey}/${subscriptionId}/${action}/${groupId ?? 0}`;
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const parseEditSubscriptionCallbackData = (data: string) => ({
  subscriptionId: BigInt(
    required(data.split('/')[1], 'subscriptionId is required in callback data')
  ),
  action: required(
    data.split('/')[2] as EditSubscriptionAction,
    'action is required in callback data'
  ),
  groupId:
    BigInt(required(data.split('/')[3], 'groupId is required in callback data')) || undefined,
});

const emojiNumbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

let subscribed = false;

// todo sub check already subscribed
// todo sub subscriptions periods
// todo sub команда "обратиться в поддержку"
// todo sub buttons emojies
// todo sub до какого числа действует подписка?
// todo sub resubscribe
const subscriptionCommandController: ChatController = ({
  chat$,
  services: { db, telegramBot },
}) => {
  chat$.subscribe(async (msg) => {
    try {
      if (msg.chat.type !== 'private') {
        return await subscribeFromPrivateChat(telegramBot, msg);
      }

      const user = required(msg.from, 'User is required');
      const subscriptions = await db.getUserSubscriptions(user.id);
      // todo 2sub для бусти выводить инструкцию
      const activeSubscriptions = subscriptions.filter(
        (s) => s.paymentProvider !== 'Boosty' && isSubscriptionActive(s)
      );
      const userSubscription = activeSubscriptions.find((s) => s.userId != null);
      const groupsSubscriptions = activeSubscriptions.filter((s) => s.chatId != null);

      const groupId = toBigInt(getCommandParams(msg));
      if (groupId == null) {
        return await chooseObject({ userSubscription, groupsSubscriptions, telegramBot, user });
      }

      if (activeSubscriptions.length === 0) {
        return await objectCallback({
          object: ObjectType.group,
          id: groupId,
          db,
          telegramBot,
          user,
        });
      }

      await telegramBot.sendMessage(
        user.id,
        // todo sub какую группу?
        'Вы хотите оплатить новую подписку или перевести существующую на эту группу?',
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
                text: `Переключить подписку с "${
                  decryptIfExists(s.chat?.title) ?? 'группы ' + s.chatId
                }" на эту группу`,
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
    } catch (error) {
      logger.error('Error in subscriptionCommandController', error);
    }
  });

  if (!subscribed) {
    subscribed = true;
    telegramBot.onCallbackQuery((query) => tgButtonCallback(query, db, telegramBot));
    ukassaService.onPaymentSucceeded<UkassaWebhookMetadata>((webhook) =>
      paymentSucceeded(webhook, db, telegramBot)
    );
  }
};

export default subscriptionCommandController;

async function subscribeFromPrivateChat(
  telegramBot: TelegramBotService,
  msg: TelegramBot.Message
): Promise<void> {
  const botName = await telegramBot.getUsername();
  await telegramBot.sendMessage(msg.chat.id, 'Нажмите на кнопку ниже, чтобы оформить подписку 😉', {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '⭐ Оформить подписку',
            url: `https://t.me/${botName}?start=subscription=${msg.chat.id}`,
          },
        ],
      ],
    },
  });
}

async function chooseObject({
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

function formatPrice(price: number): string {
  return `${Math.floor(price / 100)}₽`;
}

async function tgButtonCallback(
  query: CallbackQuery,
  db: DbService,
  telegramBot: TelegramBotService
): Promise<void> {
  try {
    if (query.data == null) return;

    const key = query.data.split('/')[0];

    // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
    switch (key) {
      case objectCallbackKey: {
        await objectCallback({
          ...parseObjectCallbackData(query.data),
          db,
          telegramBot,
          user: query.from,
        });
        break;
      }
      case tariffCallbackKey: {
        await tariffCallback({
          ...parseTariffCallbackData(query.data),
          db,
          telegramBot,
          user: query.from,
        });
        break;
      }
      case editSubscriptionCallbackKey: {
        await editSubscriptionCallback({
          ...parseEditSubscriptionCallbackData(query.data),
          db,
          telegramBot,
          user: query.from,
        });
        break;
      }
    }
  } catch (error) {
    logger.error('Error in subscriptionCommandController', error);
  }
}

// todo sub редактирование
// todo sub новый групповой чат
async function objectCallback({
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

    // todo sub детали подписки
    await telegramBot.sendMessage(user.id, `Как вы хотите изменить подписку?`, {
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
            {
              text: 'Отписаться',
              callback_data: makeEditSubscriptionCallbackData(
                id,
                EditSubscriptionAction.unsubscribe
              ),
            },
          ],
        ].filter(Boolean),
      },
    });
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

async function chooseTariff({
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
  const tariffs = await db.getAllTariffs();

  // todo sub как отписаться?
  const text = `**⭐ Выберите подписку:**\n
    ${tariffs
      .map(
        (tariff, index) =>
          `**${emojiNumbers[index]} ${esc(tariff.name)} \\(${formatPrice(
            tariff.price
            // eslint-disable-next-line sonarjs/no-nested-template-literals
          )} / мес\\)**${Boolean(tariff.description) ? `\n_${esc(tariff.description)}_` : ''}`
      )
      .join('\n\n')}`;

  await telegramBot.sendMessage(user.id, text, {
    parse_mode: 'MarkdownV2',
    reply_markup: {
      inline_keyboard: tariffs.map((tariff, index) => [
        {
          text: `${emojiNumbers[index]} ${tariff.name} (${formatPrice(tariff.price)} / мес)`,
          callback_data: makeTariffCallbackData(object, id, tariff.id),
        },
      ]),
    },
  });
}

async function tariffCallback({
  object,
  id,
  tariffId,
  db,
  telegramBot,
  user,
}: {
  object: ObjectType;
  id: bigint;
  tariffId: string;
  db: DbService;
  telegramBot: TelegramBotService;
  user: TelegramBot.User;
}): Promise<void> {
  const tariffs = await db.getAllTariffs();
  const tariff = tariffs.find((t) => t.id === tariffId);

  if (!tariff) {
    logger.warn(`Tariff with id ${tariffId} not found`);
    return;
  }

  // todo sub remove loading
  await telegramBot.sendMessage(user.id, '⏳ Подождите…');

  const botName = await telegramBot.getUsername();
  const paymentUrl = await ukassaService.createPayment<UkassaWebhookMetadata>({
    price: tariff.price,
    description: `Подписка на тариф "${tariff.name}"`, // todo sub подробнее
    returnUrl: `https://t.me/${botName}`,
    metadata: {
      object,
      id,
      tariffId,
      userId: user.id,
      username: user.username,
      secret: getEnv().UKASSA_WEBHOOK_SECRET_KEY,
    },
  });

  await telegramBot.sendMessage(
    user.id,
    '❗ Пожалуйста, отметьте опцию `Разрешаю автосписания` \\(`I allow debiting money automatically`\\) если не хотите вручную продлевать подписку каждый месяц\\. В этом случае подписка будет продлеваться автоматически\\.\n\n⭐ Ссылка на оплату 👇',
    {
      parse_mode: 'MarkdownV2',
      reply_markup: {
        inline_keyboard: [[{ text: 'Оплатить через сервис ЮKassa', url: paymentUrl }]],
      },
    }
  );
}

async function paymentSucceeded(
  webhook: UKassaPaymentWebhook<UkassaWebhookMetadata>,
  db: DbService,
  telegramBot: TelegramBotService
): Promise<void> {
  const { object, id, tariffId, userId, username } = webhook.object.metadata;

  if (object === ObjectType.subscription) {
    // todo change subscription
  } else {
    await db.addSubscription({
      autoRenew: webhook.object.payment_method.saved,
      paymentMethodId: webhook.object.payment_method.id,
      renewPeriodMonths: 1,
      paymentProvider: PaymentProvider.YooKassa,
      expires: addMonths(new Date(), 1),
      tariffId,
      subscriber: {
        id: userId,
        username,
      },
      object: object === ObjectType.user ? { userId } : { chatId: Number(id) },
    });

    await telegramBot.sendMessage(
      userId,
      '💸 Оплата прошла успешно!\n✅ Ваша подписка активирована!'
    ); // todo sub instructions
  }
}

async function editSubscriptionCallback({
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
  // const subscription = await db.getSubscription(subscriptionId);

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
        // todo sub нужно из группы написать команду /subscription
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
      await objectCallback({
        object: ObjectType.subscription,
        id: subscriptionId,
        db,
        telegramBot,
        user,
      });
      break;
    }
  }
}
