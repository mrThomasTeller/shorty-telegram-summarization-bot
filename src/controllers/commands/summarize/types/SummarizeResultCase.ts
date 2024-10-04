import { type GptResultCase } from '../../../../api/gpt.ts';
import { type SubscriptionWithTariff } from '../../../../services/DbService.ts';

export type SummarizeResultCase =
  | GptResultCase
  | NoMessagesSummarizeResultCase
  | FewMessagesSummarizeResultCase
  | TooManySummaryPartsSummarizeResultCase
  | TooManySummariesSummarizeResultCase
  | StartSummarySummarizeResultCase
  | SummaryHeaderSummarizeResultCase
  | EndSummarySummarizeResultCase
  | AdsSummarizeResultCase;

export type NoMessagesSummarizeResultCase = { type: 'noMessages' };

export type FewMessagesSummarizeResultCase = { type: 'fewMessages' };

export type TooManySummaryPartsSummarizeResultCase = { type: 'tooManySummaryParts'; count: number };

export type TooManySummariesSummarizeResultCase = { type: 'tooManySummaries'; hasPremium: boolean };

export type StartSummarySummarizeResultCase = { type: 'startSummary' };

export type SummaryHeaderSummarizeResultCase = {
  type: 'summaryHeader';
  usedPremium: boolean;
  userPremium: boolean;
};

export type EndSummarySummarizeResultCase = {
  type: 'endSummary';
  freeSummariesRest: number;
  premiumSummariesRest: number;
  subscription: SubscriptionWithTariff | undefined;
};

export type AdsSummarizeResultCase = { type: 'ads' };
