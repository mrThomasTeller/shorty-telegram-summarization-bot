import 'dotenv/config';
import { required } from '../lib/common/lang.ts';

type Env = {
  TELEGRAM_BOT_TOKEN: string;
  GPT_API_KEY: string;
  NODE_ENV: 'development' | 'production';
  MODE: 'WORK' | 'MAINTENANCE';
  WHITE_CHATS_LIST: string;
  ADMIN_ID: number;
  RETRY_GPT_QUERY_TIME: number;
  MIN_MESSAGES_COUNT_TO_SUMMARIZE: number;
  MAX_SUMMARIES_PER_WEEK: number;
  MAX_SUMMARY_PARTS: number;
  CRYPTO_KEY: string;
  GRAM_ADS_TOKEN: string;
  DUMMY_GPT_RESPONSES: boolean;
  TIME_TO_SHOW_ADS: number;
  SHOW_ADS: boolean | number;
  MAINTENANCE_MESSAGE: string | undefined;
  DEV_SHOW_ALL_TG_MESSAGES: boolean;
  UKASSA_SHOP_ID: string;
  UKASSA_SECRET_KEY: string;
  WEBSERVER_PORT: string;
  EMAIL_FOR_SSL_NOTIFICATIONS: string;
  SERVER_NAME: string;
  UKASSA_WEBHOOK_SECRET_PATH: string;
  UKASSA_WEBHOOK_SECRET_KEY: string;
};

export function getEnv(): Env {
  const showAds = required(process.env.SHOW_ADS);
  return {
    GPT_API_KEY: required(process.env.GPT_API_KEY),
    MODE: parseMode(process.env.MODE),
    NODE_ENV: required(process.env.NODE_ENV) as 'development' | 'production',
    TELEGRAM_BOT_TOKEN: required(process.env.TELEGRAM_BOT_TOKEN),
    WHITE_CHATS_LIST: process.env.WHITE_CHATS_LIST ?? '',
    ADMIN_ID: Number(required(process.env.ADMIN_ID)),
    RETRY_GPT_QUERY_TIME: Number(required(process.env.RETRY_GPT_QUERY_TIME)),
    MIN_MESSAGES_COUNT_TO_SUMMARIZE: Number(required(process.env.MIN_MESSAGES_COUNT_TO_SUMMARIZE)),
    MAX_SUMMARIES_PER_WEEK: Number(required(process.env.MAX_SUMMARIES_PER_WEEK)),
    MAX_SUMMARY_PARTS: Number(required(process.env.MAX_SUMMARY_PARTS)),
    CRYPTO_KEY: required(process.env.CRYPTO_KEY),
    GRAM_ADS_TOKEN: required(process.env.GRAM_ADS_TOKEN),
    DUMMY_GPT_RESPONSES: process.env.DUMMY_GPT_RESPONSES === 'true',
    TIME_TO_SHOW_ADS: Number(required(process.env.TIME_TO_SHOW_ADS)),
    SHOW_ADS: showAds === 'true' ? true : showAds === 'false' ? false : Number(showAds),
    MAINTENANCE_MESSAGE: process.env.MAINTENANCE_MESSAGE,
    DEV_SHOW_ALL_TG_MESSAGES: process.env.DEV_SHOW_ALL_TG_MESSAGES === 'true',
    UKASSA_SHOP_ID: required(process.env.UKASSA_SHOP_ID),
    UKASSA_SECRET_KEY: required(process.env.UKASSA_SECRET_KEY),
    WEBSERVER_PORT: required(process.env.WEBSERVER_PORT),
    EMAIL_FOR_SSL_NOTIFICATIONS: required(process.env.EMAIL_FOR_SSL_NOTIFICATIONS),
    SERVER_NAME: required(process.env.SERVER_NAME),
    UKASSA_WEBHOOK_SECRET_PATH: required(process.env.UKASSA_WEBHOOK_SECRET_PATH),
    UKASSA_WEBHOOK_SECRET_KEY: required(process.env.UKASSA_WEBHOOK_SECRET_KEY),
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
