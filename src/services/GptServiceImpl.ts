import OpenAI from 'openai';
import type GptService from './GptService';
import { required } from '../lib/common/lang';
import { getEnv } from '../config/envVars';
import _ from 'lodash';
import type { ChatMessage, SendMessageOptions } from './GptService';

const gptModel = 'gpt-5-mini';

export default class GptServiceImpl implements GptService {
  private api?: OpenAI;

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

    const completion = await this.api.chat.completions.create({
      model: options?.completionParams?.model ?? gptModel,
      messages: [{ role: 'user', content: message }],
      ...options?.completionParams,
    });

    return {
      id: completion.id,
      role: 'assistant' as const,
      text: completion.choices[0]?.message?.content ?? '',
    };
  }

  createApi(): OpenAI {
    return new OpenAI({
      apiKey: required(getEnv().GPT_API_KEY),
    });
  }
}
