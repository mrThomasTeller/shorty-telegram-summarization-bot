import { type SubscriptionWithTariff } from './../services/DbService.ts';

export const isSubscriptionActive = (subscription: SubscriptionWithTariff): boolean =>
  subscription.expires > new Date();

export const getSortedActiveSubscriptions = (
  subscriptions: SubscriptionWithTariff[]
): SubscriptionWithTariff[] =>
  subscriptions
    .filter((s) => isSubscriptionActive(s))
    .sort((a, b) => getSubscriptionPriority(a) - getSubscriptionPriority(b));

export const getFirstActiveSubscription = (
  subscriptions: SubscriptionWithTariff[]
): SubscriptionWithTariff | undefined => getSortedActiveSubscriptions(subscriptions)[0];

const getSubscriptionPriority = (subscription: SubscriptionWithTariff): number =>
  subscription.chatId == null ? 0 : 1;
