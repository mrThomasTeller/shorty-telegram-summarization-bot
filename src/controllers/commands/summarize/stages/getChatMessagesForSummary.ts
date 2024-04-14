import { yesterday } from '../../../../lib/date.ts';
import type Services from '../../../../services/Services.ts';
import { max as maxTime } from 'date-fns';
import type TelegramBot from 'node-telegram-bot-api';
import { type SummarizeResultCase } from '../types/SummarizeResultCase.ts';
import { type ChatMessagesForSummaryData } from '../types/ChatMessagesForSummaryData.ts';
import _ from 'lodash';
import { type Either } from 'fp-ts/lib/Either';
import { either } from 'fp-ts';
import { type LimitsData } from '../types/LimitsData.ts';

export const getChatMessagesForSummary = _.curry(
  async (
    services: Services,
    msg: TelegramBot.Message,
    limits: LimitsData
  ): Promise<Either<SummarizeResultCase, ChatMessagesForSummaryData>> => {
    const summariesRest = limits.freeSummariesRest + limits.premiumSummariesRest;

    if (summariesRest <= 0) {
      return either.left({ type: 'tooManySummaries', hasPremium: !!limits.subscription });
    }

    const startSummaryFrom = maxTime([limits.lastSummaryDate ?? yesterday(), yesterday()]);

    return either.right({
      ...limits,
      messages: await services.db.getChatMessages(msg.chat.id, startSummaryFrom),
      freeSummariesRest: Math.max(limits.freeSummariesRest - 1, 0),
      premiumSummariesRest:
        limits.freeSummariesRest > 0
          ? limits.premiumSummariesRest
          : limits.premiumSummariesRest - 1,
      usedPremium: limits.freeSummariesRest <= 0,
    });
  }
);
