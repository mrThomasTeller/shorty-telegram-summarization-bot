import type { Subscription, Tariff } from '@prisma/client';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { t } from '../config/translations/index';
import { required } from '../lib/common/lang';
import {
  type SubscriptionWithTariff,
  type SubscriptionWithTariffAndChat,
} from './../services/DbService';
import { getGroupTitle } from './dbChatUtils';
import { getTariffText, type TariffTextFormat } from './tariffUtils';
import { escapeTelegramMarkdown } from './telegramBotMessageUtils';

export const isSubscriptionActive = (subscription: SubscriptionWithTariff): boolean =>
  subscription.expires > new Date() && !subscription.deactivated;

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

  return subscription.paymentMethodId == null
    ? `Ваша подписка действует до ${formattedDate}`
    : `Автосписание по вашей подписке произойдет ${formattedDate}`;
};

export function getSubscriptionObjectText({
  subscription,
  grammarCase = 'nom',
  objectGrammarCase = 'acc',
  tariffText = 'name',
  markdown = false,
  subscriptionTerm = true,
}: {
  subscription: Pick<SubscriptionWithTariffAndChat, 'userId' | 'chatId' | 'chat'> & {
    tariff?: Tariff;
  };
  grammarCase?: 'nom' | 'acc';
  objectGrammarCase?: 'nom' | 'acc';
  tariffText?: TariffTextFormat | 'none';
  markdown?: boolean;
  subscriptionTerm?: boolean;
}): string {
  const subscriptionTermText = subscriptionTerm
    ? subscription.chatId == null
      ? t(`terms.individual_subscription_${grammarCase}_one`)
      : t(`terms.subscription_${grammarCase}_one`) + ' на '
    : '';

  const object =
    subscription.chatId == null
      ? ''
      : getGroupTitle({
          chatId: required(subscription.chatId, 'chatId is required'),
          chat: subscription.chat,
          grammarCase: objectGrammarCase,
          alwaysAddGroupTerm: true,
          markdown,
        });

  const additionalText_ =
    tariffText !== 'none' && subscription.tariff
      ? ` (${getTariffText({
          tariff: subscription.tariff,
          format: tariffText,
        })})`
      : '';
  const additionalText = markdown
    ? `_${escapeTelegramMarkdown(additionalText_)}_`
    : additionalText_;

  return `${subscriptionTermText}${object}${additionalText}`;
}

// fixme: timezone
export const getSubscriptionExpireFormattedDate = (subscription: Subscription): string =>
  `${format(new Date(subscription.expires), 'dd.MM.yyyy HH:mm', { locale: ru })} по МСК`;
