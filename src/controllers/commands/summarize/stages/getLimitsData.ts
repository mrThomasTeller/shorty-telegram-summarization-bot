import { yesterday, thisWeekStart, thisMonthStart } from '../../../../lib/date.ts';
import type Services from '../../../../services/Services.ts';
import { getEnv } from '../../../../config/envVars.ts';
import { max as maxTime } from 'date-fns';
import type TelegramBot from 'node-telegram-bot-api';
import _ from 'lodash';
import { type LimitsData } from '../types/LimitsData.ts';

export const getLimitsData = _.curry(
  async (services: Services, msg: TelegramBot.Message): Promise<LimitsData> => {
    // todo test
    const [summariesFor24Hours, weekChatFreeSummariesCount, subscription] = await Promise.all([
      services.db.getSummariesFrom(msg.chat.id, yesterday()),
      services.db.countSummariesFrom({
        chatId: msg.chat.id,
        from: thisWeekStart(),
        usedPremium: false,
      }),
      services.db.getSubscription(msg.chat.id, msg.from?.id),
    ]);

    const monthPremiumSummariesCount = subscription
      ? await services.db.countSummariesFrom({
          // todo брать не начало месяца, а начало оплаченного периода
          from: thisMonthStart(),
          usedPremium: true,
          ...(subscription.userId == null
            ? { chatId: msg.chat.id }
            : { userId: Number(subscription.userId) }),
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
    };
  }
);
