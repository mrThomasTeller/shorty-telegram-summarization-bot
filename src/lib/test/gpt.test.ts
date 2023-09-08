import { mock } from 'jest-mock-extended';
import { sendMessageToGpt } from '../gpt.js';
import { ChatGPTError, type ChatMessage } from 'chatgpt';
import type GptService from '../../services/GptService.js';

const createChatGPTError = (statusCode: number, message: string): ChatGPTError => {
  const error = new ChatGPTError(message);
  error.statusCode = statusCode;
  return error;
};

describe('sendMessageToGpt', () => {
  const text = 'Test message';

  const gptService = mock<GptService>();
  beforeEach(() => {
    gptService.sendMessage.mockReset();
  });

  it('should return result text on successful call', async () => {
    const expectedResult = 'Hello, test message received.';
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    gptService.sendMessage.mockResolvedValue({ text: expectedResult } as ChatMessage);

    const result = await sendMessageToGpt({ text, gptService });
    expect(result).toEqual(expectedResult);
  });

  it('should retry on rate limit error', async () => {
    const expectedResult = 'Hello, rate limit test passed.';

    gptService.sendMessage.mockRejectedValueOnce(createChatGPTError(429, 'Rate limit error.'));
    gptService.sendMessage.mockRejectedValueOnce(createChatGPTError(429, 'Rate limit error.'));
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    gptService.sendMessage.mockResolvedValue({ text: expectedResult } as ChatMessage);

    const result = await sendMessageToGpt({ text, maxTries: 3, retryTime: 100, gptService });
    expect(result).toEqual(expectedResult);
  });

  it('should throw error when maxTries reached', async () => {
    const expectedError = 'Максимальное количество попыток отправить сообщение GPT достигнуто';

    gptService.sendMessage.mockRejectedValue(createChatGPTError(429, 'Rate limit error.'));

    await expect(sendMessageToGpt({ text, maxTries: 1, gptService })).rejects.toThrow(
      expectedError
    );
  });

  it('should call onBusy when rate limited', async () => {
    const onBusy = jest.fn();

    gptService.sendMessage.mockRejectedValueOnce(createChatGPTError(429, 'Rate limit error.'));
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    gptService.sendMessage.mockResolvedValue({ text: 'Hello, onBusy test passed.' } as ChatMessage);

    await sendMessageToGpt({ text, maxTries: 2, retryTime: 100, onBusy, gptService });
    expect(onBusy).toHaveBeenCalledTimes(1);
  });

  it('should call onBroken when maxTries reached', async () => {
    const onBroken = jest.fn();
    gptService.sendMessage.mockRejectedValue(createChatGPTError(429, 'Rate limit error.'));

    await sendMessageToGpt({ text, maxTries: 1, onBroken, gptService }).catch(() => {});
    expect(onBroken).toHaveBeenCalledTimes(1);
  });

  it('should rethrow error when error is not a rate limit error', async () => {
    const expectedError = 'Unknown error';
    gptService.sendMessage.mockRejectedValue(new Error(expectedError));

    await expect(sendMessageToGpt({ text, gptService })).rejects.toThrow(expectedError);
  });
});
