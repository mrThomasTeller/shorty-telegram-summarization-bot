import fp_ from 'lodash/fp.js';
import config from '../config/config';
import { getEnv } from '../config/envVars';
import { splitText } from '../lib/common/text';

export function getPartsAndPointsCountForText(
  fullText: string
): { pointsCount: number; text: string }[] {
  const textParts = splitText(fullText, getEnv().SUMMARY_MAX_PART_LENGTH);

  const pointsCount = fp_.cond([
    [fp_.isEqual(1), () => getPointsCountForOnePart(fullText)],
    [fp_.isEqual(2), fp_.constant(4)],
    [fp_.isEqual(3), fp_.constant(3)],
    [fp_.stubTrue, fp_.constant(2)],
  ])(textParts.length);

  return textParts.map((text) => ({
    pointsCount,
    text,
  }));
}

const getPointsCountForOnePart = (text: string): number =>
  Math.min(
    Math.ceil(text.length / getEnv().SUMMARY_SYMBOLS_FOR_ONE_POINT),
    config.summary.maxPointsCount
  );

export const formatSummaryFromGpt = (summary: string): string => summary.replace(/\.$/, '');
