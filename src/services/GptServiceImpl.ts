import { ChatGPTAPI, type ChatMessage, type SendMessageOptions } from 'chatgpt';
import type GptService from './GptService';
import { required } from '../lib/utils.js';
import { getEnv } from '../config/env.js';

export default class GptServiceImpl implements GptService {
  constructor(
    private readonly api = new ChatGPTAPI({
      apiKey: required(getEnv().GPT_API_KEY),
      completionParams: {
        max_tokens: 2048,
        model: 'gpt-4',
      },
    })
  ) {}

  sendMessage(message: string, options?: SendMessageOptions): Promise<ChatMessage> {
    return this.api.sendMessage(message, options);
  }
}
