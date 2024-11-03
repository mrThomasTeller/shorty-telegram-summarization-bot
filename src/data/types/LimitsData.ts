import { type SubscriptionWithTariff } from '../../services/DbService';

export type LimitsData = {
  lastSummaryDate: Date | undefined;
  freeSummariesRest: number;
  premiumSummariesRest: number;
  subscription: SubscriptionWithTariff | undefined;
  maxTextToSummarizeApproximateLength: number;
  maxSummaryParts: number;
};
