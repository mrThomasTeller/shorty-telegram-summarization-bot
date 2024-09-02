import { type Subscription } from '@prisma/client';
import * as dateFns from 'date-fns';
import config from '../../config/config.ts';
import { getEnv } from '../../config/envVars.ts';
import logger from '../../config/logger.ts';
import { monthFromPeriodStart } from '../../lib/date.ts';
import type DbService from '../../services/DbService.ts';
import type TelegramBotService from '../../services/TelegramBotService.ts';
import type EntryPoint from '../EntryPoint.ts';

const subscriptionsExpirationNotifier: EntryPoint = async ({ db, telegramBot }) => {
  logger.info('Notifier started');

  setInterval(async () => {
    const subscriptions = await db.getAllSubscriptions();

    for (const subscription of subscriptions) {
      const monthAfterSubscription = dateFns.addMonths(subscription.createdAt, 1);
      const subscriptionPeriodStart = monthFromPeriodStart(subscription.createdAt);

      await notifyIfNecessary({
        notificationTime: dateFns.max([
          dateFns.addDays(subscriptionPeriodStart, 1),
          monthAfterSubscription,
        ]),
        subscription,
        db,
        telegramBot,
      });
    }
  }, config.notifier.checkInterval);
};

export default subscriptionsExpirationNotifier;

async function notifyIfNecessary({
  subscription,
  notificationTime,
  db,
  telegramBot,
}: {
  subscription: Subscription;
  notificationTime: Date;
  db: DbService;
  telegramBot: TelegramBotService;
}): Promise<boolean> {
  if (notificationTime > subscription.notifiedAt && new Date() >= notificationTime) {
    await telegramBot.sendMessage(
      getEnv().ADMIN_ID,
      `Проверь подписку:
EMail: ${subscription.email}
Дата/время оформления: ${dateFns.format(subscription.createdAt, 'HH:mm d MMM yyyy')}`
    );
    await db.setSubscriptionNotifiedAt(subscription.id, notificationTime);
    return true;
  }

  return false;
}
