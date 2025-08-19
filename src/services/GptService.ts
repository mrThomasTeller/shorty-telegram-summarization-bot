export type ChatMessage = {
  id: string;
  role: 'assistant' | 'user';
  text: string;
};

export type SendMessageOptions = {
  completionParams?: {
    model?: string;
    max_tokens?: number;
    temperature?: number;
    [key: string]: unknown;
  };
};

type GptService = {
  sendMessage: (
    message: string,
    options?: Pick<SendMessageOptions, 'completionParams'>
  ) => Promise<ChatMessage>;
};

export default GptService;
