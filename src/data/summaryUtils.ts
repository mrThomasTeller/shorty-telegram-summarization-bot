import { splitText } from '../lib/text.ts';
import fp_ from 'lodash/fp.js';

const maxPartLength = 3400;
const maxPointsCount = 5;
const symbolsForOnePoint = 150 * 3;

export function getPartsAndPointsCountForText(
  fullText: string
): { pointsCount: number; text: string }[] {
  const textParts = splitText(fullText, maxPartLength);

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
  Math.min(Math.ceil(text.length / symbolsForOnePoint), maxPointsCount);
