import type { Subscription } from '@prisma/client';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  type SubscriptionWithTariff,
  type SubscriptionWithTariffAndChat,
} from './../services/DbService.ts';
import { getGroupTitle } from './dbChatUtils.ts';
import { required } from '../lib/lang.ts';
import { getTariffPriceText } from './tariffUtils.ts';
import { t } from '../config/translations/index.ts';
import { escapeTelegramMarkdown } from './telegramBotMessageUtils.ts';

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
  const formattedDate = getSubscriptionExpireFormattedDate(subscription);

  return subscription.autoRenew
    ? `Автосписание по вашей подписке произойдет ${formattedDate}`
    : `Ваша подписка действует до ${formattedDate}`;
};

export function getSubscriptionObjectText({
  subscription,
  grammarCase = 'nom',
  addition = 'tariff',
  markdown = false,
}: {
  subscription: SubscriptionWithTariffAndChat;
  grammarCase?: 'nom' | 'acc';
  addition?: 'tariffAndPrice' | 'tariff' | 'none';
  markdown?: boolean;
}): string {
  const price = addition === 'tariffAndPrice' ? `, ${getTariffPriceText(subscription.tariff)}` : '';

  const additionalText_ = addition === 'none' ? '' : ` (${subscription.tariff.name}${price})`;
  const additionalText = markdown
    ? `_${escapeTelegramMarkdown(additionalText_)}_`
    : additionalText_;

  const subscriptionTerm = t(`terms.subscription_${grammarCase}_one`);

  const object = Boolean(subscription.userId)
    ? markdown
      ? '`себя`'
      : 'себя'
    : getGroupTitle({
        chatId: required(subscription.chatId, 'chatId is required'),
        chat: subscription.chat,
        grammarCase: 'acc',
        alwaysAddGroupTerm: true,
        markdown,
      });

  return `${subscriptionTerm} на ${object}${additionalText}`;
}

export const getSubscriptionExpireFormattedDate = (subscription: Subscription): string =>
  `${format(new Date(subscription.expires), 'dd.MM.yyyy HH:mm', { locale: ru })} по МСК`;
