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
}: {
  db: DbService;
  telegramBot: TelegramBotService;
  userId: number | bigint | undefined;
  chatId: number | bigint;
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
        price: price ? ` (${getTariffPriceText(limitsData.subscription.tariff)})` : '',
        rest: restText,
        expires: getSubscriptionExpiresText(limitsData.subscription),
        thanks: thanks ? t('tariff.thanks') : '',
        interpolation: { escapeValue: false },
      })
    : t('tariff.free', { rest: restText });
}

export const getTariffPriceText = (tariff: Tariff): string => `${formatPrice(tariff.price)} / мес`;

const formatPrice = (price: number): string => `${Math.floor(price / 100)}₽`;
