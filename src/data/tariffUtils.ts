import { type Tariff } from '@prisma/client';
import { type Nullish } from 'utility-types';
import config from '../config/config.ts';
import { getEnv } from '../config/envVars.ts';

export const getMaxSummaryParts = (tariff: Tariff | Nullish): number =>
  getEnv().MAX_SUMMARY_PARTS * (tariff?.messagesMultiplier ?? 1);

export const getMaxTextToSummarizeApproximateLength = (tariff: Tariff | Nullish): number =>
  getMaxSummaryParts(tariff) * config.summary.maxPartLength;
