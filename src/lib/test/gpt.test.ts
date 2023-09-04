import { sendMessageToGpt } from '../gpt.js';
import { ChatGPTAPI, ChatGPTError } from 'chatgpt';

type ChatGPTAPIMock = ChatGPTAPI & {
  sendMessage: jest.Mock<Promise<{ text: string }>, Parameters<ChatGPTAPI['sendMessage']>>;
};

const createChatGPTError = (statusCode: number, message: string): ChatGPTError => {
  const error = new ChatGPTError(message);
  error.statusCode = statusCode;
  return error;
};

describe('sendMessageToGpt', () => {
  const text = 'Test message';

  const dummyApi = new ChatGPTAPI({ apiKey: 'dummy_key', completionParams: {} }) as ChatGPTAPIMock;
  beforeEach(() => {
    dummyApi.sendMessage = jest.fn();
  });

  it('should return result text on successful call', async () => {
    const expectedResult = 'Hello, test message received.';
    dummyApi.sendMessage.mockResolvedValue({ text: expectedResult });

    const result = await sendMessageToGpt({ text, api: dummyApi });
    expect(result).toEqual(expectedResult);
  });

  it('should retry on rate limit error', async () => {
    const expectedResult = 'Hello, rate limit test passed.';

    dummyApi.sendMessage.mockRejectedValueOnce(createChatGPTError(429, 'Rate limit error.'));
    dummyApi.sendMessage.mockRejectedValueOnce(createChatGPTError(429, 'Rate limit error.'));
    dummyApi.sendMessage.mockResolvedValue({ text: expectedResult });

    const result = await sendMessageToGpt({ text, maxTries: 3, retryTime: 100, api: dummyApi });
    expect(result).toEqual(expectedResult);
  });

  it('should throw error when maxTries reached', async () => {
    const expectedError = 'Максимальное количество попыток отправить сообщение GPT достигнуто';

    dummyApi.sendMessage.mockRejectedValue(createChatGPTError(429, 'Rate limit error.'));

    await expect(sendMessageToGpt({ text, maxTries: 1, api: dummyApi })).rejects.toThrow(
      expectedError
    );
  });

  it('should call onBusy when rate limited', async () => {
    const onBusy = jest.fn();

    dummyApi.sendMessage.mockRejectedValueOnce(createChatGPTError(429, 'Rate limit error.'));
    dummyApi.sendMessage.mockResolvedValue({ text: 'Hello, onBusy test passed.' });

    await sendMessageToGpt({ text, maxTries: 2, retryTime: 100, onBusy, api: dummyApi });
    expect(onBusy).toHaveBeenCalledTimes(1);
  });

  it('should call onBroken when maxTries reached', async () => {
    const onBroken = jest.fn();
    dummyApi.sendMessage.mockRejectedValue(createChatGPTError(429, 'Rate limit error.'));

    await sendMessageToGpt({ text, maxTries: 1, onBroken, api: dummyApi }).catch(() => {});
    expect(onBroken).toHaveBeenCalledTimes(1);
  });

  it('should rethrow error when error is not a rate limit error', async () => {
    const expectedError = 'Unknown error';
    dummyApi.sendMessage.mockRejectedValue(new Error(expectedError));

    await expect(sendMessageToGpt({ text, api: dummyApi })).rejects.toThrow(expectedError);
  });
});
