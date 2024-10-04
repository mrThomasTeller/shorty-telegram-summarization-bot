import type DbChatMessage from '../../../../data/types/DbChatMessage.ts';
import { type LimitsData } from '../../../../data/types/LimitsData.ts';

export type ChatMessagesForSummaryData = LimitsData & {
  messages: DbChatMessage[];
  usedPremium: boolean;
};
