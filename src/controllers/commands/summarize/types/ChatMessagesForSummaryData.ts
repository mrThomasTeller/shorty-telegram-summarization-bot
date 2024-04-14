import type DbChatMessage from '../../../../data/DbChatMessage.ts';
import { type LimitsData } from './LimitsData.ts';

export type ChatMessagesForSummaryData = LimitsData & {
  messages: DbChatMessage[];
  usedPremium: boolean;
};
