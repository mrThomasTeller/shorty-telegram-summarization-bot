import 'dotenv/config';
import { required } from '../lib/common.ts';

type Env = {
  TELEGRAM_BOT_TOKEN: string;
  GPT_API_KEY: string;
  NODE_ENV: string;
  MODE: 'WORK' | 'MAINTENANCE';
  WHITE_CHATS_LIST: string;
  RETRY_GPT_QUERY_TIME: number;
  MIN_MESSAGES_COUNT_TO_SUMMARIZE: number;
  MAX_SUMMARIES_PER_DAY: number;
  MAX_SUMMARY_PARTS: number;
  CRYPTO_KEY: string;
};

export function getEnv(): Env {
  return {
    GPT_API_KEY: required(process.env.GPT_API_KEY),
    MODE: parseMode(process.env.MODE),
    NODE_ENV: required(process.env.NODE_ENV),
    TELEGRAM_BOT_TOKEN: required(process.env.TELEGRAM_BOT_TOKEN),
    WHITE_CHATS_LIST: process.env.WHITE_CHATS_LIST ?? '',
    RETRY_GPT_QUERY_TIME: Number(required(process.env.RETRY_GPT_QUERY_TIME)),
    MIN_MESSAGES_COUNT_TO_SUMMARIZE: Number(required(process.env.MIN_MESSAGES_COUNT_TO_SUMMARIZE)),
    MAX_SUMMARIES_PER_DAY: Number(required(process.env.MAX_SUMMARIES_PER_DAY)),
    MAX_SUMMARY_PARTS: Number(required(process.env.MAX_SUMMARY_PARTS)),
    CRYPTO_KEY: required(process.env.CRYPTO_KEY),
  };
}

export function getWhiteChatsList(): number[] | undefined {
  const whiteChatsList = process.env.WHITE_CHATS_LIST;
  return whiteChatsList === '' || whiteChatsList === undefined
    ? undefined
    : getEnv().WHITE_CHATS_LIST.split(',').map(Number);
}

export function setWhiteChatsList(chatIds: number[] | undefined): void {
  setEnv({ WHITE_CHATS_LIST: chatIds === undefined ? '' : chatIds.join(',') });
}

export function setEnv(env: Partial<Env>): void {
  Object.assign(process.env, env);
}

function parseMode(mode: string | undefined): Env['MODE'] {
  if (mode === 'WORK' || mode === 'MAINTENANCE') {
    return mode;
  }

  throw new Error(`Unknown mode: ${mode}`);
}
