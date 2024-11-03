import config from '../config/config';
import { splitText } from '../lib/common/text';
import fp_ from 'lodash/fp.js';

export function getPartsAndPointsCountForText(
  fullText: string
): { pointsCount: number; text: string }[] {
  const textParts = splitText(fullText, config.summary.maxPartLength);

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
    Math.ceil(text.length / config.summary.symbolsForOnePoint),
    config.summary.maxPointsCount
  );

export const formatSummaryFromGpt = (summary: string): string => summary.replace(/\.$/, '');
