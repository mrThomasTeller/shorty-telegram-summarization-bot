/* eslint-disable unicorn/filename-case */
/* eslint-disable @typescript-eslint/consistent-type-definitions */
import 'node-telegram-bot-api';

declare module 'node-telegram-bot-api' {
  interface ChatShared {
    request_id: number;
    chat_id: number;
    title?: string;
  }
}
