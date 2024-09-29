import { type Summary } from '@prisma/client';
import { max as maxTime } from 'date-fns';
import _ from 'lodash';
import type TelegramBot from 'node-telegram-bot-api';
import { getEnv } from '../../../../config/envVars.ts';
import {
  getMaxSummaryParts,
  getMaxTextToSummarizeApproximateLength,
} from '../../../../data/tariffUtils.ts';
import { monthFromPeriodStart, thisWeekStart, yesterday } from '../../../../lib/date.ts';
import { type SubscriptionWithTariff } from '../../../../services/DbService.ts';
import type DbService from '../../../../services/DbService.ts';
import type Services from '../../../../services/Services.ts';
import { type LimitsData } from '../types/LimitsData.ts';
import { isSubscriptionActive } from '../../../../data/subscriptionUtils.ts';

// todo sub test
export const getLimitsData = _.curry(
  async (services: Services, msg: TelegramBot.Message): Promise<LimitsData> => {
    // todo test
    const [summariesFor24Hours, weekChatFreeSummariesCount, subscriptions] = await Promise.all([
      services.db.getSummariesFrom(msg.chat.id, yesterday()),
      services.db.countSummariesFrom({
        chatId: msg.chat.id,
        from: thisWeekStart(),
        usedPremium: false,
      }),
      services.db.getSubscriptions(msg.chat.id, msg.from?.id),
    ]);

    const limitsDataArr = await Promise.all(
      subscriptions.map((subscription) =>
        getLimitsDataForSubscription({
          subscription,
          summariesFor24Hours,
          weekChatFreeSummariesCount,
          db: services.db,
          chatId: msg.chat.id,
        })
      )
    );

    const userSubscriptions = limitsDataArr.filter(
      (limitsData) => limitsData.subscription?.userId != null
    );
    const groupSubscriptions = limitsDataArr.filter(
      (limitsData) => limitsData.subscription?.chatId != null
    );

    const prioritizedSubscriptions = [...groupSubscriptions, ...userSubscriptions];

    const activeSubscription = prioritizedSubscriptions.find(
      (limitsData) =>
        limitsData.subscription &&
        isSubscriptionActive(limitsData.subscription) &&
        limitsData.premiumSummariesRest > 0
    );

    return (
      activeSubscription ??
      prioritizedSubscriptions[0] ??
      (await getLimitsDataForSubscription({
        subscription: undefined,
        summariesFor24Hours,
        weekChatFreeSummariesCount,
        db: services.db,
        chatId: msg.chat.id,
      }))
    );
  }
);

async function getLimitsDataForSubscription({
  subscription,
  summariesFor24Hours,
  weekChatFreeSummariesCount,
  db,
  chatId,
}: {
  subscription: SubscriptionWithTariff | undefined;
  summariesFor24Hours: Summary[];
  weekChatFreeSummariesCount: number;
  db: DbService;
  chatId: number;
}): Promise<LimitsData> {
  const monthPremiumSummariesCount = subscription
    ? await db.countSummariesFrom({
        from: monthFromPeriodStart(subscription.createdAt),
        usedPremium: true,
        ...(subscription.userId == null ? { chatId } : { userId: Number(subscription.userId) }),
      })
    : 0;

  const freeSummariesRest = Math.max(
    getEnv().MAX_SUMMARIES_PER_WEEK - weekChatFreeSummariesCount,
    0
  );
  const premiumSummariesRest = subscription
    ? Math.max(subscription.tariff.summaries - monthPremiumSummariesCount, 0)
    : 0;

  const lastSummaryDate = summariesFor24Hours.at(-1)?.date ?? yesterday();

  return {
    freeSummariesRest,
    premiumSummariesRest,
    subscription,
    lastSummaryDate: maxTime([lastSummaryDate, yesterday()]),
    maxSummaryParts: getMaxSummaryParts(subscription?.tariff),
    maxTextToSummarizeApproximateLength: getMaxTextToSummarizeApproximateLength(
      subscription?.tariff
    ),
  };
}
