import { ChatGPTAPI, type ChatMessage, type SendMessageOptions } from 'chatgpt';
import type GptService from './GptService';
import { required } from '../lib/common/lang';
import { getEnv } from '../config/envVars';
import _ from 'lodash';

export default class GptServiceImpl implements GptService {
  private api?: ChatGPTAPI;

  async sendMessage(
    message: string,
    options?: Pick<SendMessageOptions, 'completionParams'>
  ): Promise<ChatMessage> {
    if (getEnv().DUMMY_GPT_RESPONSES) {
      return {
        id: _.uniqueId(),
        role: 'assistant',
        text: `Dummy response on ${message}`,
      };
    }

    if (this.api === undefined) {
      this.api = this.createApi();
    }

    return await this.api.sendMessage(message, options);
  }

  createApi(): ChatGPTAPI {
    return new ChatGPTAPI({
      apiKey: required(getEnv().GPT_API_KEY),
      completionParams: {
        max_tokens: 2048,
        model: 'gpt-4o',
      },
    });
  }
}
