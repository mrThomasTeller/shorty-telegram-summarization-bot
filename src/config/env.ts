import 'dotenv/config';
import { required } from '../lib/utils.ts';

type Env = {
  TELEGRAM_BOT_TOKEN: string;
  GPT_API_KEY: string;
  DATABASE_URL: string;
  NODE_ENV: string;
  MODE: string;
  WHITE_CHATS_LIST: string;
  BOT_NAME: string;
  RETRY_GPT_QUERY_TIME: number;
};

export function getEnv(): Env {
  return {
    DATABASE_URL: required(process.env.DATABASE_URL),
    GPT_API_KEY: required(process.env.GPT_API_KEY),
    MODE: required(process.env.MODE),
    NODE_ENV: required(process.env.NODE_ENV),
    TELEGRAM_BOT_TOKEN: required(process.env.TELEGRAM_BOT_TOKEN),
    WHITE_CHATS_LIST: required(process.env.WHITE_CHATS_LIST),
    BOT_NAME: required(process.env.BOT_NAME),
    RETRY_GPT_QUERY_TIME: Number(required(process.env.RETRY_GPT_QUERY_TIME)),
  };
}

export function getWhiteChatsList(): number[] {
  return getEnv()
    .WHITE_CHATS_LIST.split(',')
    .map((chatId) => Number(chatId));
}

export function setWhiteChatsList(chatIds: number[]): void {
  setEnv({ WHITE_CHATS_LIST: chatIds.join(',') });
}

export function setEnv(env: Partial<Env>): void {
  Object.assign(process.env, env);
}
