import { type ChatMessage, type SendMessageOptions } from 'chatgpt';

type GptService = {
  sendMessage: (message: string, options?: SendMessageOptions) => Promise<ChatMessage>;
};

export default GptService;
