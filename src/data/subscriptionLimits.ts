import { type Summary } from '@prisma/client';
import { max as maxTime } from 'date-fns';
import { t } from 'i18next';
import _ from 'lodash';
import type TelegramBot from 'node-telegram-bot-api';
import { match } from 'ts-pattern';
import { getEnv } from '../config/envVars.ts';
import { monthFromPeriodStart, thisWeekStart, yesterday } from '../lib/date.ts';
import type DbService from '../services/DbService.ts';
import { type SubscriptionWithTariff } from '../services/DbService.ts';
import type Services from '../services/Services.ts';
import { isSubscriptionActive } from './subscriptionUtils.ts';
import { getMaxSummaryParts, getMaxTextToSummarizeApproximateLength } from './tariffUtils.ts';
import { type LimitsData } from './types/LimitsData.ts';

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

export const getSummariesRestText = (
  limits: Pick<LimitsData, 'freeSummariesRest' | 'premiumSummariesRest' | 'subscription'>,
  chatId: number,
  botName: string
): string =>
  t(getRestTranslationKey(limits), {
    free: limits.freeSummariesRest,
    freeTotal: getEnv().MAX_SUMMARIES_PER_WEEK,
    premium: limits.premiumSummariesRest,
    botName,
    chatId,
  });

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
    .with({ freeSummariesRest: 0 }, () => 'shared.rest.premiumNoFree' as const)
    .otherwise(() => 'shared.rest.premiumWithFree' as const);
