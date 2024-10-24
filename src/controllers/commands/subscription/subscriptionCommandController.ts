import { PaymentProvider } from '@prisma/client';
import { addMonths } from 'date-fns';
import type TelegramBot from 'node-telegram-bot-api';
import logger from '../../../config/logger.ts';
import { isSubscriptionActive } from '../../../data/subscriptionUtils.ts';
import { getCommandParams } from '../../../data/telegramBotMessageUtils.ts';
import { required, toBigInt } from '../../../lib/lang.ts';
import type DbService from '../../../services/DbService.ts';
import type TelegramBotService from '../../../services/TelegramBotService.ts';
import { type UKassaPaymentWebhook } from '../../../services/UKassaService/UKassaPaymentWebhook.ts';
import { ukassaService } from '../../../services/UKassaService/UKassaService.ts';
import type ChatController from '../../ChatController.ts';
import { chooseObject } from './chooseObject.ts';
import { chooseTariff } from './chooseTariff.ts';
import { chooseSubscriptionToChange } from './editSubscription.ts';
import { tgButtonCallback } from './tgButtonsCallbacks.ts';
import { ObjectType } from './types/ObjectType.ts';
import { type UkassaWebhookMetadata } from './types/UkassaWebhookMetadata.ts';

let subscribed = false;

// todo tsub check already subscribed
// todo 2sub subscriptions periods
// todo 2sub discounts for long periods
// todo tsub buttons emojies
// todo 2sub возможность докупать пакеты выжимок
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

      const hasActiveBoostySubscription = subscriptions.some(
        (s) => s.paymentProvider === 'Boosty' && isSubscriptionActive(s)
      );
      if (hasActiveBoostySubscription) {
        return await forBoostySubscription(telegramBot, msg.chat.id);
      }

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
        return await chooseTariff({
          object: ObjectType.group,
          id: groupId,
          db,
          telegramBot,
          user,
        });
      }

      await chooseSubscriptionToChange({
        telegramBot,
        user,
        groupId,
        userSubscription,
        groupsSubscriptions,
        db,
      });
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

async function forBoostySubscription(
  telegramBot: TelegramBotService,
  chatId: number
): Promise<void> {
  await telegramBot.sendMessage(
    chatId,
    '❗ У вас есть активные подписки на Boosty. В будущем мы перестанем принимать оплату через Boosty. Чтобы переоформить подписку и иметь возможность управлять ей через Telegram обратитесь в поддержку @shorty_support_bot. В этом случае вы получите бонусный бесплатный месяц!'
  );
}

async function paymentSucceeded(
  webhook: UKassaPaymentWebhook<UkassaWebhookMetadata>,
  db: DbService,
  telegramBot: TelegramBotService
): Promise<void> {
  const { object, id, tariffId, userId, username } = webhook.object.metadata;

  if (object === ObjectType.subscription) {
    // todo 2sub брать только разницу в деньгах
    await db.updateSubscription(id, {
      expires: addMonths(new Date(), 1),
      renewPeriodMonths: 1,
      tariffId,
      paymentProvider: PaymentProvider.YooKassa,
      paymentMethodId: webhook.object.payment_method.id,
      autoRenew: webhook.object.payment_method.saved,
    });

    const tariff = await db.getTariff(tariffId);

    await telegramBot.sendMessage(
      userId,
      `💸 Оплата прошла успешно!\n✅ Теперь вы на тарифе "${tariff.name}"!`
    );
  } else {
    await db.addSubscription(
      {
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
      },
      true
    );

    await telegramBot.sendMessage(
      userId,
      '💸 Оплата прошла успешно!\n✅ Ваша подписка активирована!'
    ); // todo 2sub instructions
  }
}
