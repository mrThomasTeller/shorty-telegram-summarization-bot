import { type Subscription } from '@prisma/client';
import * as dateFns from 'date-fns';
import config from '../../config/config';
import { getEnv } from '../../config/envVars';
import logger from '../../config/logger';
import { monthFromPeriodStart } from '../../lib/common/date';
import type DbService from '../../services/DbService';
import type TelegramBotService from '../../services/TelegramBotService';
import type EntryPoint from '../EntryPoint';

const subscriptionsExpirationNotifier: EntryPoint = async ({ db, telegramBot }) => {
  logger.info('Notifier started');

  await checkSubscriptions({ db, telegramBot });
  setInterval(async () => {
    await checkSubscriptions({ db, telegramBot });
  }, config.notifier.checkInterval);
};

export default subscriptionsExpirationNotifier;

async function checkSubscriptions({
  db,
  telegramBot,
}: {
  db: DbService;
  telegramBot: TelegramBotService;
}): Promise<void> {
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
}

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
  if (
    subscription.paymentProvider === 'Boosty' &&
    subscription.notifiedAt != null &&
    notificationTime > subscription.notifiedAt &&
    new Date() >= notificationTime
  ) {
    await telegramBot.sendMessage(
      getEnv().ADMIN_ID,
      `Проверь подписку:
EMail: ${subscription.email}
Дата/время оформления: ${dateFns.format(subscription.createdAt, 'HH:mm d MMM yyyy')}`
    );
    await db.updateSubscription(subscription.id, { notifiedAt: notificationTime });
    return true;
  }

  return false;
}
