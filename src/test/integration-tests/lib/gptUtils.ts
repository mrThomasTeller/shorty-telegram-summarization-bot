import { type ChatMessage } from 'chatgpt';
import _ from 'lodash';

export function createGptChatMessage(text: string): ChatMessage {
  return {
    role: 'assistant',
    id: _.uniqueId('gpt-mock-'),
    conversationId: undefined,
    parentMessageId: _.uniqueId('gpt-mock-'),
    text,
  };
}

export const gptTestSummary = (page: number, itemsOnPage: number): string =>
  `gpt test summary:\n${_.range(page * itemsOnPage + 1, (page + 1) * itemsOnPage + 1)
    .map((num) => `${num}. test summary point`)
    .join('\n')}`;
