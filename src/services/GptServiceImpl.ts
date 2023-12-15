import { ChatGPTAPI, type ChatMessage, type SendMessageOptions } from 'chatgpt';
import type GptService from './GptService.js';
import { required } from '../lib/common.js';
import { getEnv } from '../config/envVars.js';

export default class GptServiceImpl implements GptService {
  private api?: ChatGPTAPI;

  async sendMessage(
    message: string,
    options?: Pick<SendMessageOptions, 'completionParams'>
  ): Promise<ChatMessage> {
    if (this.api === undefined) {
      this.api = new ChatGPTAPI({
        apiKey: required(getEnv().GPT_API_KEY),
        completionParams: {
          max_tokens: 2048,
          model: 'gpt-4-1106-preview',
        },
      });
    }

    return await this.api.sendMessage(message, options);
  }
}
