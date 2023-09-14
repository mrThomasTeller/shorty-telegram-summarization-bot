import { wait } from './async';
import type GptService from '../services/GptService';
import { getEnv } from '../config/env';

export async function sendMessageToGpt({
  text,
  maxTries = 5,
  retryTime = getEnv().RETRY_GPT_QUERY_TIME,
  onBusy,
  onBroken,
  gptService,
}: {
  text: string;
  maxTries?: number;
  retryTime?: number;
  onBusy?: () => void | Promise<void>;
  onBroken?: () => void | Promise<void>;
  gptService: GptService;
}): Promise<string> {
  const { ChatGPTError } = await import('chatgpt');
  try {
    const result = await gptService.sendMessage(text, {
      completionParams: { max_tokens: 2048 },
    });
    return result.text;
  } catch (error) {
    // Too Many Requests - ждём 25 секунд
    if (error instanceof ChatGPTError && error.statusCode === 429) {
      if (maxTries === 1) {
        if (onBroken !== undefined) await onBroken();
        throw new Error('Максимальное количество попыток отправить сообщение GPT достигнуто');
      }

      if (onBusy !== undefined) await onBusy();
      await wait(retryTime);
      return await sendMessageToGpt({
        text,
        onBusy,
        onBroken,
        maxTries: maxTries - 1,
        gptService,
        retryTime,
      });
    }
    throw error;
  }
}
