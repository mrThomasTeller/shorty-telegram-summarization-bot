import { type ChatMessage, type SendMessageOptions } from 'chatgpt';

type GptService = {
  sendMessage: (
    message: string,
    options?: Pick<SendMessageOptions, 'completionParams'>
  ) => Promise<ChatMessage>;
};

export default GptService;
