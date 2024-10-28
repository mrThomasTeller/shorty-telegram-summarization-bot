import type DbChatMessage from '../../../../data/types/DbChatMessage';
import { type LimitsData } from '../../../../data/types/LimitsData';

export type ChatMessagesForSummaryData = LimitsData & {
  messages: DbChatMessage[];
  usedPremium: boolean;
};
