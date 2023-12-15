import { ChatGPTAPI } from 'chatgpt';
import { required } from '../lib/common.js';
import { getEnv } from '../config/envVars.js';
export default class GptServiceImpl {
    async sendMessage(message, options) {
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
