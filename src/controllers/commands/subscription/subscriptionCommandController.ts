import { PaymentProvider, type Subscription } from '@prisma/client';
import { addMonths } from 'date-fns';
import type TelegramBot from 'node-telegram-bot-api';
import { match } from 'ts-pattern';
import logger from '../../../config/logger';
import { getSubscriptionObjectText, isSubscriptionActive } from '../../../data/subscriptionUtils';
import { getTariffRestText } from '../../../data/tariffUtils';
import { required } from '../../../lib/common/lang';
import { blockedMessagesService } from '../../../services/BlockedMessagesService';
import type DbService from '../../../services/DbService';
import type TelegramBotService from '../../../services/TelegramBotService';
import { type UKassaPaymentWebhook } from '../../../services/UKassaService/UKassaPaymentWebhook';
import { ukassaService } from '../../../services/UKassaService/UKassaService';
import type ChatController from '../../ChatController';
import { ucFirst } from './../../../lib/common/string';
import { chooseObject } from './chooseObject';
import { makeEditSubscriptionUrl, makeGroupUrl, route } from './routing';
import { EditSubscriptionAction } from './types/EditSubscriptionAction';
import { ObjectType } from './types/ObjectType';
import { type UkassaWebhookMetadata } from './types/UkassaWebhookMetadata';

// todo tsub check already subscribed
// todo 2sub subscriptions periods
// todo 2sub discounts for long periods
// todo 2sub возможность докупать пакеты выжимок
// todo tsub мне нужна помощь
// todo 2sub кнопка назад
// fixme дать возможность только админам чата управлять подписками
// fixme настроить скоупы для команд
const subscriptionCommandController: ChatController = ({
  chat$,
  services: { db, telegramBot },
}) => {
  chat$.subscribe(async (msg) => {
    await handleMessage(db, telegramBot, msg);
  });
};

subscriptionCommandController.onStart = async ({ db, telegramBot }) => {
  ukassaService.onPaymentSucceeded<UkassaWebhookMetadata>((webhook) =>
    paymentSucceeded(webhook, db, telegramBot)
  );
};

export default subscriptionCommandController;

async function handleMessage(
  db: DbService,
  telegramBot: TelegramBotService,
  msg: TelegramBot.Message
): Promise<void> {
  try {
    if (msg.chat.type !== 'private') {
      return await subscribeFromGroupChat(db, telegramBot, msg);
    }

    const routed = await route(msg, db, telegramBot);
    if (routed) return;

    const user = required(msg.from, 'User is required');
    const subscriptions = await db.getAllUserSubscriptions(user.id);

    const hasActiveBoostySubscription = subscriptions.some(
      (s) => s.paymentProvider === 'Boosty' && isSubscriptionActive(s)
    );
    if (hasActiveBoostySubscription) {
      return await forBoostySubscription(telegramBot, msg.chat.id);
    }

    const unexpiredSubscriptions = subscriptions.filter(
      (s) => s.paymentProvider !== 'Boosty' && s.expires > new Date()
    );
    const userSubscription = unexpiredSubscriptions.find((s) => s.userId != null);
    const groupsSubscriptions = unexpiredSubscriptions.filter((s) => s.chatId != null);

    return await chooseObject({ userSubscription, groupsSubscriptions, telegramBot, user, db });
  } catch (error) {
    if (isBlockedError(error)) {
      blockedMessagesService.push(msg.chat.id, msg);
    } else {
      logger.error('Error in subscriptionCommandController', error);
    }
  }
}

async function subscribeFromGroupChat(
  db: DbService,
  telegramBot: TelegramBotService,
  msg: TelegramBot.Message
): Promise<void> {
  const botName = await telegramBot.getUsername();
  const subscription = msg.from && (await db.getUserSubscription(msg.from.id, msg.chat.id));
  const verb = subscription ? 'редактировать' : 'оформить';

  await telegramBot.sendMessage(msg.chat.id, `Нажмите на кнопку ниже, чтобы ${verb} подписку 😉`, {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: `⭐ ${ucFirst(verb)} подписку`,
            url: makeGroupUrl({ botName, id: BigInt(msg.chat.id) }),
          },
        ],
      ],
    },
  });
}

async function forBoostySubscription(
  telegramBot: TelegramBotService,
  chatId: number
): Promise<void> {
  await telegramBot.sendMessage(
    chatId,
    '❗ У вас есть активные подписки на Boosty. В будущем мы перестанем принимать оплату через Boosty.\n\n⭐️ Чтобы переоформить подписку и иметь возможность управлять ей через Telegram обратитесь в поддержку @shorty_support_bot. В этом случае вы получите бонусный бесплатный месяц!'
  );
}

async function paymentSucceeded(
  webhook: UKassaPaymentWebhook<UkassaWebhookMetadata>,
  db: DbService,
  telegramBot: TelegramBotService
): Promise<void> {
  const { object, id, tariffId, userId, username, autoRenew } = webhook.object.metadata;
  const paymentMethod = webhook.object.payment_method;

  const paymentData = {
    paymentProvider: PaymentProvider.YooKassa,
    paymentMethodId: paymentMethod.saved ? paymentMethod.id : null,
    payedAt: new Date(),
  } satisfies Partial<Subscription>;

  const subscription = await match(object)
    .with(ObjectType.subscription, async () => {
      // todo 2sub брать только разницу в деньгах
      await db.updateSubscription(BigInt(id), {
        ...paymentData,
        expires: addMonths(new Date(), 1),
        deactivated: false,
        renewPeriodMonths: 1,
        tariffId,
        disableSubscriptionCheck: false,
      });

      return await db.getSubscription(BigInt(id));
    })
    .otherwise(async () => {
      const oldSubscription = await db.getUserSubscription(
        userId,
        object === ObjectType.group ? Number(id) : undefined
      );

      if (oldSubscription) {
        await db.deleteSubscription(BigInt(id));
      }

      return await db.addSubscription({
        ...paymentData,
        renewPeriodMonths: 1,
        expires: addMonths(new Date(), 1),
        tariffId,
        subscriber: {
          id: userId,
          username,
        },
        object: object === ObjectType.user ? { userId } : { chatId: Number(id) },
      });
    });

  const mainText = autoRenew
    ? 'Автопродление вашей подписки прошло успешно!'
    : 'Оплата прошла успешно!';

  const subObjectText = getSubscriptionObjectText({ subscription, tariffText: 'none' });

  const tariffText = await getTariffRestText({
    subscription,
    db,
    telegramBot,
    userId,
    chatId: Number(id),
    price: true,
  });

  const botName = await telegramBot.getUsername();

  await telegramBot.sendMessage(
    userId,
    `💸 ${mainText}\n\n💼 ${ucFirst(subObjectText)}\n${tariffText}`,
    autoRenew
      ? {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '🚫 Отключить автопродление',
                  url: makeEditSubscriptionUrl({
                    botName,
                    subscriptionId: BigInt(id),
                    action: EditSubscriptionAction.unsubscribe,
                  }),
                },
              ],
            ],
          },
        }
      : undefined
  ); // todo 2sub instructions
}

const isBlockedError = (error: unknown): boolean =>
  error instanceof Error &&
  'response' in error &&
  typeof error.response === 'object' &&
  error.response != null &&
  'statusCode' in error.response &&
  typeof error.response.statusCode === 'number' &&
  error.response.statusCode === 403;
