import { addMonths } from 'date-fns';
import { setTimeout } from 'node:timers/promises';
import config from '../../config/config.ts';
import { getEnv } from '../../config/envVars.ts';
import { required } from '../../lib/lang.ts';
import type DbService from '../../services/DbService.ts';
import type TelegramBotService from '../../services/TelegramBotService.ts';
import { ukassaService } from '../../services/UKassaService/UKassaService.ts';
import type EntryPoint from '../EntryPoint';

export const subscriptionsRenewer: EntryPoint = async ({ db, telegramBot }) => {
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

    // todo sub minus 10 minutes
    if (subscription.expires < now) {
      if (subscription.autoRenew) {
        // renew
        try {
          const tariff = required(
            tariffs.find((t) => t.id === subscription.tariffId),
            'Tariff not found'
          );

          // todo sub обработать ошибки снятия
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

          await db.updateSubscription(subscription.id, {
            expires: addMonths(subscription.expires, subscription.renewPeriodMonths),
            // todo sub payed at
          });
        } catch (error) {
          // todo sub notify about autorenewal error
          // todo sub try to renew again
          console.log('Ошибка платежа', error);
        }
      } else {
        // todo sub notify about expired subscription
      }
    }
  }
}
