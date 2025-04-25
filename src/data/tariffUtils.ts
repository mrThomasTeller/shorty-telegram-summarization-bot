import { type Tariff } from '@prisma/client';
import { type Nullish } from 'utility-types';
import config from '../config/config';
import { getEnv } from '../config/envVars';
import { t } from '../config/translations/index';
import { required } from '../lib/common/lang';
import type DbService from '../services/DbService';
import { type SubscriptionWithTariff } from '../services/DbService';
import type TelegramBotService from '../services/TelegramBotService';
import { getLimitsData, getSummariesRestText } from './subscriptionLimits';
import { getSubscriptionExpiresText } from './subscriptionUtils';

export const getMaxSummaryParts = (tariff: Tariff | Nullish): number =>
  getEnv().MAX_SUMMARY_PARTS * (tariff?.messagesMultiplier ?? 1);

export const getMaxTextToSummarizeApproximateLength = (tariff: Tariff | Nullish): number =>
  getMaxSummaryParts(tariff) * config.summary.maxPartLength;

// todo не надо брать chatId если передали subscription
export async function getTariffRestText({
  db,
  telegramBot,
  userId,
  chatId,
  subscription,
  thanks = false,
  price = false,
  formatExpires = (expires) => expires,
}: {
  db: DbService;
  telegramBot: TelegramBotService;
  userId: number | bigint | undefined;
  chatId: number | bigint;
  // todo ну, это совсем чмошно..
  formatExpires?: (expires: string) => string;
  price?: boolean;
  subscription?: SubscriptionWithTariff;
  thanks?: boolean;
}): Promise<string> {
  const limitsData = await getLimitsData({ db, userId, chatId, subscription });
  const botName = required(await telegramBot.getUsername(), 'Bot name is required');
  const restText = getSummariesRestText(limitsData, chatId, botName);

  return limitsData.subscription
    ? t('tariff.premium', {
        name: limitsData.subscription.tariff.name,
        price: price ? ` (${getTariffText({ subscription: limitsData.subscription })})` : '',
        rest: restText,
        expires: formatExpires(getSubscriptionExpiresText(limitsData.subscription)),
        thanks: thanks ? t('tariff.thanks') : '',
        interpolation: { escapeValue: false },
      })
    : t('tariff.free', { rest: restText, interpolation: { escapeValue: false } });
}

export type TariffTextFormat = 'name' | 'price' | 'nameAndPrice';

export const getTariffText = (
  params: {
    format?: TariffTextFormat;
    separator?: string;
  } & (
    | { tariff: Tariff }
    | { subscription: Pick<SubscriptionWithTariff, 'tariff' | 'paymentMethodId'> }
  )
): string => {
  const { format = 'price', separator = ', ' } = params;
  const tariff = 'tariff' in params ? params.tariff : params.subscription.tariff;
  const subscription = 'subscription' in params ? params.subscription : undefined;

  const price =
    subscription && subscription.paymentMethodId == null ? tariff.price : tariff.discountedPrice;
  const fromPrice = subscription ? '' : 'от ';

  return [
    format === 'name' || format === 'nameAndPrice' ? tariff.name : undefined,
    format === 'price' || format === 'nameAndPrice'
      ? `${fromPrice}${formatPrice(price)} / мес`
      : undefined,
  ]
    .filter(Boolean)
    .join(separator);
};

const formatPrice = (price: number): string => `${Math.floor(price / 100)}₽`;
