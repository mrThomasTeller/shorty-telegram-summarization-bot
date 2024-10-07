import type { Subscription } from '@prisma/client';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  type SubscriptionWithTariff,
  type SubscriptionWithTariffAndChat,
} from './../services/DbService.ts';
import { getGroupTitle } from './dbChatUtils.ts';
import { required } from '../lib/lang.ts';

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

// Автосписание по вашей подписке произойдет 01.01.2024 12:00 по МСК
// или
// Ваша подписка действует до 01.01.2024 12:00 по МСК
export const getSubscriptionExpiresText = (subscription: Subscription): string => {
  const expiresDate = new Date(subscription.expires);
  const formattedDate = format(expiresDate, 'dd.MM.yyyy HH:mm', { locale: ru });

  return subscription.autoRenew
    ? `Автосписание по вашей подписке произойдет ${formattedDate} по МСК`
    : `Ваша подписка действует до ${formattedDate} по МСК`;
};

export const getSubscriptionObjectText = (subscription: SubscriptionWithTariffAndChat): string =>
  Boolean(subscription.userId)
    ? `Подписка на себя (${subscription.tariff.name})`
    : `Подписка на "${getGroupTitle(
        required(subscription.chatId, 'chatId is required'),
        subscription.chat,
        'gen'
      )}" (${subscription.tariff.name})`;
