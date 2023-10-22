import { type ChatMessage } from 'chatgpt';
import _ from 'lodash';
import { gptTestSummaryPartStart } from './constants.ts';

export function createGptChatMessage(text: string): ChatMessage {
  return {
    role: 'assistant',
    id: _.uniqueId('gpt-mock-'),
    conversationId: undefined,
    parentMessageId: _.uniqueId('gpt-mock-'),
    text,
  };
}

/**
 * Generates a test summary for a given page and number of points on the page.
 * @param page - The page number to generate the summary for.
 * @param pointsOnPage - The number of points on the page.
 * @param offsetPointsPage - default: page. If you want points to start from 1, pass 0 here.
 * @returns A string representing the generated test summary.
 *
 * @example
 * const summary = gptTestSummary(2, 3);
 * console.log(summary);
 * `gpt test summary:
 *  7. test summary point for page 2
 *  8. test summary point for page 2
 *  9. test summary point for page 2`
 *
 * @example
 * const summary = gptTestSummary(2, 3, 0);
 * console.log(summary);
 * `gpt test summary:
 *  1. test summary point for page 2
 *  2. test summary point for page 2
 *  3. test summary point for page 2`
 *
 * @example
 * const summary = gptTestSummary(2, 3, 1);
 * console.log(summary);
 * `gpt test summary:
 *  4. test summary point for page 2
 *  5. test summary point for page 2
 *  6. test summary point for page 2`
 */
export const gptTestSummary = (
  page: number,
  pointsOnPage: number,
  offsetPointsPage = page
): string => {
  const pointsRange = _.range(
    offsetPointsPage * pointsOnPage + 1,
    (offsetPointsPage + 1) * pointsOnPage + 1
  );

  return `${gptTestSummaryPartStart}\n${pointsRange
    .map((num) => `${num}. test summary point for page ${page}`)
    .join('\n')}`;
};
