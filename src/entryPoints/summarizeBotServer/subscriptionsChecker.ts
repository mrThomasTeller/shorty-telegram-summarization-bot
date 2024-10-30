import { PaymentProvider, type Tariff } from '@prisma/client';
import { addDays } from 'date-fns';
import { type InlineKeyboardButton } from 'node-telegram-bot-api';
import { setTimeout } from 'node:timers/promises';
import config from '../../config/config';
import { getEnv } from '../../config/envVars';
import logger from '../../config/logger';
import {
  makeEditSubscriptionUrl,
  makeTariffUrl,
} from '../../controllers/commands/subscription/routing';
import { EditSubscriptionAction } from '../../controllers/commands/subscription/types/EditSubscriptionAction';
import { ObjectType } from '../../controllers/commands/subscription/types/ObjectType';
import { type UkassaWebhookMetadata } from '../../controllers/commands/subscription/types/UkassaWebhookMetadata';
import { getSubscriptionObjectText } from '../../data/subscriptionUtils';
import { required } from '../../lib/common/lang';
import type DbService from '../../services/DbService';
import { type SubscriptionWithTariffAndChat } from '../../services/DbService';
import type TelegramBotService from '../../services/TelegramBotService';
import {
  UKassaPaymentCanceledError,
  ukassaService,
} from '../../services/UKassaService/UKassaService';
import type EntryPoint from '../EntryPoint';

export const subscriptionsChecker: EntryPoint = async ({ db, telegramBot }) => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  while (true) {
    try {
      await checkSubscriptions({ db, telegramBot });
    } catch (error) {
      logger.error('subscriptionsChecker error', error);
    }
    await setTimeout(config.subscriptions.checkInterval);
  }
};

async function checkSubscriptions({
  db,
  telegramBot,
}: {
  db: DbService;
  telegramBot: TelegramBotService;
}): Promise<void> {
  const subscriptions = await db.getAllSubscriptions();
  const tariffs = await db.getAllTariffs();
  const botName = await telegramBot.getUsername();

  for (const subscription of subscriptions) {
    if (!shouldProcessSubscription(subscription)) {
      continue;
    }

    // eslint-disable-next-line unicorn/prefer-ternary
    if (subscription.autoRenew) {
      await handleAutoRenewSubscription({
        subscription,
        tariffs,
        db,
        telegramBot,
        botName,
      });
    } else {
      await handleExpiredSubscription({
        subscription,
        db,
        telegramBot,
        botName,
      });
    }
  }
}

function shouldProcessSubscription(subscription: SubscriptionWithTariffAndChat): boolean {
  return (
    subscription.paymentProvider === PaymentProvider.YooKassa &&
    subscription.expires < new Date() &&
    !subscription.disableSubscriptionCheck
  );
}

async function handleAutoRenewSubscription({
  subscription,
  tariffs,
  db,
  telegramBot,
  botName,
}: {
  subscription: SubscriptionWithTariffAndChat;
  tariffs: Tariff[];
  db: DbService;
  telegramBot: TelegramBotService;
  botName: string;
}): Promise<void> {
  try {
    await renewSubscription(subscription, tariffs);
  } catch (error) {
    if (!(error instanceof UKassaPaymentCanceledError)) {
      throw error;
    }
    await handleFailedRenewal({ subscription, db, telegramBot, botName });
  }
}

async function renewSubscription(
  subscription: SubscriptionWithTariffAndChat,
  tariffs: Tariff[]
): Promise<void> {
  const tariff = required(
    tariffs.find((t) => t.id === subscription.tariffId),
    'Tariff not found'
  );

  await ukassaService.createPayment<UkassaWebhookMetadata>({
    description: `Автоматическое списание платежа за подписку на Shorty. Тариф: ${tariff.name}. Период оплаты: 1 месяц.`,
    metadata: {
      secret: getEnv().UKASSA_WEBHOOK_SECRET_KEY,
      tariffId: tariff.id,
      userId: Number(subscription.subscriberUserId),
      username: subscription.subscriberUserName ?? undefined,
      object: ObjectType.subscription,
      id: Number(subscription.id),
      autoRenew: true,
    },
    price: tariff.price,
    paymentMethodId: subscription.paymentMethodId ?? undefined,
  });
}

async function handleFailedRenewal({
  subscription,
  db,
  telegramBot,
  botName,
}: {
  subscription: SubscriptionWithTariffAndChat;
  db: DbService;
  telegramBot: TelegramBotService;
  botName: string;
}): Promise<void> {
  const triesToRenew = subscription.triesToRenew + 1;

  // eslint-disable-next-line unicorn/prefer-ternary
  if (triesToRenew >= config.subscriptions.maxTriesToRenew) {
    await handleMaxRetriesReached({ subscription, db, telegramBot, botName });
  } else {
    await handleRetryScheduled({ subscription, db, telegramBot, botName, triesToRenew });
  }
}

async function handleMaxRetriesReached({
  subscription,
  db,
  telegramBot,
  botName,
}: {
  subscription: SubscriptionWithTariffAndChat;
  db: DbService;
  telegramBot: TelegramBotService;
  botName: string;
}): Promise<void> {
  await db.updateSubscription(subscription.id, {
    disableSubscriptionCheck: true,
    triesToRenew: 0,
  });

  await telegramBot.sendMessage(
    Number(subscription.subscriberUserId),
    `⚠️ ${getEndSubscriptionText(subscription)} Не получилось автоматически продлить подписку.`,
    {
      reply_markup: {
        inline_keyboard: [[renewSubscriptionButton('⭐️ Продлить вручную', botName, subscription)]],
      },
    }
  );
}

async function handleRetryScheduled({
  subscription,
  db,
  telegramBot,
  botName,
  triesToRenew,
}: {
  subscription: SubscriptionWithTariffAndChat;
  db: DbService;
  telegramBot: TelegramBotService;
  botName: string;
  triesToRenew: number;
}): Promise<void> {
  await db.updateSubscription(subscription.id, {
    triesToRenew,
    deactivated: true,
    expires: addDays(new Date(), 1),
  });

  await telegramBot.sendMessage(
    Number(subscription.subscriberUserId),
    `⚠️ ${getEndSubscriptionText(
      subscription
    )} Не получилось автоматически продлить подписку.\n\n⏰ Попробую ещё раз завтра.`,
    {
      reply_markup: {
        inline_keyboard: [
          [renewSubscriptionButton('⭐️ Продлить вручную', botName, subscription)],
          [unsubscribeButton(botName, subscription)],
        ],
      },
    }
  );
}

async function handleExpiredSubscription({
  subscription,
  db,
  telegramBot,
  botName,
}: {
  subscription: SubscriptionWithTariffAndChat;
  db: DbService;
  telegramBot: TelegramBotService;
  botName: string;
}): Promise<void> {
  await telegramBot.sendMessage(
    Number(subscription.subscriberUserId),
    `⚠️ ${getEndSubscriptionText(subscription)}`,
    {
      reply_markup: {
        inline_keyboard: [
          [renewSubscriptionButton('⭐️ Продлить подписку', botName, subscription)],
        ],
      },
    }
  );

  await db.updateSubscription(subscription.id, {
    disableSubscriptionCheck: true,
  });
}

const renewSubscriptionButton = (
  text: string,
  botName: string,
  subscription: SubscriptionWithTariffAndChat
): InlineKeyboardButton => ({
  text,
  url: makeTariffUrl({
    botName,
    object: ObjectType.subscription,
    id: subscription.id,
    tariffId: subscription.tariffId,
  }),
});

const unsubscribeButton = (
  botName: string,
  subscription: SubscriptionWithTariffAndChat
): InlineKeyboardButton => ({
  text: '🚫 Отключить автопродление',
  url: makeEditSubscriptionUrl({
    botName,
    subscriptionId: subscription.id,
    action: EditSubscriptionAction.unsubscribe,
  }),
});

const getEndSubscriptionText = (subscription: SubscriptionWithTariffAndChat): string =>
  `Ваша ${getSubscriptionObjectText({ subscription })} закончилась.`;
