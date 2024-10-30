import { type Summary } from '@prisma/client';
import { max as maxTime } from 'date-fns';
import { t } from 'i18next';
import { match } from 'ts-pattern';
import { getEnv } from '../config/envVars';
import { monthFromPeriodStart, thisWeekStart, yesterday } from '../lib/common/date';
import type DbService from '../services/DbService';
import { type SubscriptionWithTariff } from '../services/DbService';
import { isSubscriptionActive } from './subscriptionUtils';
import { getMaxSummaryParts, getMaxTextToSummarizeApproximateLength } from './tariffUtils';
import { type LimitsData } from './types/LimitsData';
import { makeGroupUrl } from '../controllers/commands/subscription/routing';

// todo stest
export async function getLimitsData({
  db,
  userId,
  chatId,
  subscription,
}: {
  db: DbService;
  userId: number | bigint | undefined;
  chatId: number | bigint;
  subscription?: SubscriptionWithTariff;
}): Promise<LimitsData> {
  const [summariesFor24Hours, weekChatFreeSummariesCount, subscriptions] = await Promise.all([
    db.getSummariesFrom(Number(chatId), yesterday()),
    db.countSummariesFrom({
      chatId: Number(chatId),
      from: thisWeekStart(),
      usedPremium: false,
    }),
    subscription
      ? [subscription]
      : db.getSubscriptions(Number(chatId), userId == null ? undefined : Number(userId)),
  ]);

  const limitsDataArr = await Promise.all(
    subscriptions.map((subscription) =>
      getLimitsDataForSubscription({
        subscription,
        summariesFor24Hours,
        weekChatFreeSummariesCount,
        db,
        chatId: Number(chatId),
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
      db,
      chatId: Number(chatId),
    }))
  );
}

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
      premiumSummariesRest > 0 ? subscription?.tariff : undefined
    ),
  };
}

export const getSummariesRestText = (
  limits: Pick<LimitsData, 'freeSummariesRest' | 'premiumSummariesRest' | 'subscription'>,
  chatId: number | bigint,
  botName: string
): string =>
  t(getRestTranslationKey(limits), {
    free: limits.freeSummariesRest,
    freeTotal: getEnv().MAX_SUMMARIES_PER_WEEK,
    premium: limits.premiumSummariesRest,
    botName,
    chatId,
    subscriptionUrl: makeGroupUrl({ botName, id: BigInt(chatId) }),
  });

// fixme cover
const getRestTranslationKey = (
  limits: Pick<LimitsData, 'freeSummariesRest' | 'premiumSummariesRest' | 'subscription'>
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
) =>
  match(limits)
    .with({ subscription: undefined }, () => 'shared.rest.free' as const)
    .with(
      { freeSummariesRest: 0, premiumSummariesRest: 0 },
      () => 'shared.rest.premiumEnded' as const
    )
    .otherwise(() => 'shared.rest.premium' as const);
