import { PaymentProvider } from '@prisma/client';
import { addMonths } from 'date-fns';
import { setTimeout } from 'node:timers/promises';
import config from '../../config/config.ts';
import { getEnv } from '../../config/envVars.ts';
import { getSubscriptionObjectText } from '../../data/subscriptionUtils.ts';
import { required } from '../../lib/lang.ts';
import { ucFirst } from '../../lib/string.ts';
import type DbService from '../../services/DbService.ts';
import { type SubscriptionWithTariffAndChat } from '../../services/DbService.ts';
import type TelegramBotService from '../../services/TelegramBotService.ts';
import { ukassaService } from '../../services/UKassaService/UKassaService.ts';
import type EntryPoint from '../EntryPoint.ts';

export const subscriptionsChecker: EntryPoint = async ({ db, telegramBot }) => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  while (true) {
    await checkSubscriptions({ db, telegramBot });
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

  for (const subscription of subscriptions) {
    const now = new Date();

    if (
      subscription.paymentProvider === PaymentProvider.YooKassa &&
      subscription.expires < now &&
      !subscription.disableSubscriptionCheck
    ) {
      if (subscription.autoRenew) {
        // renew
        try {
          const tariff = required(
            tariffs.find((t) => t.id === subscription.tariffId),
            'Tariff not found'
          );

          // todo tsub обработать ошибки снятия
          await ukassaService.createPayment({
            description: `Автоматическое списание платежа за подписку на Shorty. Тариф: ${tariff.name}. Период оплаты: 1 месяц.`,
            metadata: {
              secret: getEnv().UKASSA_WEBHOOK_SECRET_KEY,
              tariffId: tariff.id,
              userId: Number(subscription.subscriberUserId),
              username: subscription.subscriberUserName ?? undefined,
            },
            price: tariff.price,
            paymentMethodId: subscription.paymentMethodId ?? undefined,
          });

          // fixme cover
          await db.updateSubscription(subscription.id, {
            expires: addMonths(subscription.expires, subscription.renewPeriodMonths),
            payedAt: new Date(),
          });
        } catch (error) {
          // todo tsub notify about autorenewal error
          console.log('Ошибка платежа', error);

          const triesToRenew = subscription.triesToRenew + 1;
          if (triesToRenew >= config.subscriptions.maxTriesToRenew) {
            // fixme cover
            await db.updateSubscription(subscription.id, {
              disableSubscriptionCheck: true,
              triesToRenew: 0,
            });

            // fixme cover
            await telegramBot.sendMessage(
              Number(subscription.subscriberUserId),
              // todo tsub предложить продлить
              `${getEndSubscriptionText(
                subscription
              )} Не получилось автоматически продлить подписку. Чтобы продлить подписку вручную нажмите: /subscription-test`
            );
          } else {
            // fixme cover
            await db.updateSubscription(subscription.id, { triesToRenew });

            // fixme cover
            await telegramBot.sendMessage(
              Number(subscription.subscriberUserId),
              // todo tsub предложить продлить
              `${getEndSubscriptionText(
                subscription
              )} Не получилось автоматически продлить подписку. Попробую ещё раз завтра.

Чтобы продлить подписку вручную нажмите: /subscription-test
Отключить автоматическое продление: /subscription-disable`
            );
          }
        }
      } else {
        // fixme cover
        await telegramBot.sendMessage(
          Number(subscription.subscriberUserId),
          // todo tsub предложить продлить
          `${getEndSubscriptionText(subscription)} Чтобы продлить нажмите: /subscription-test`
        );

        // fixme cover
        await db.updateSubscription(subscription.id, {
          disableSubscriptionCheck: true,
        });
      }
    }
  }
}

const getEndSubscriptionText = (subscription: SubscriptionWithTariffAndChat): string =>
  `🔔 Ваша ${ucFirst(getSubscriptionObjectText({ subscription }))} закончилась.`;
