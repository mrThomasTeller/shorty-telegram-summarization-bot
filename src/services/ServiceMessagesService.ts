import type TelegramBot from 'node-telegram-bot-api';
import type TelegramBotService from './TelegramBotService';
import { hoursToMilliseconds } from 'date-fns';

type RequestId = number;
const maxTimeForRequest = hoursToMilliseconds(3);

// todo нужно сохранять реквесты между запусками
export class ServiceMessagesService {
  private static requestId: RequestId = 0;

  registerChatRequest(
    telegramBot: TelegramBotService,
    callback: (chatShared: TelegramBot.ChatShared, msg: TelegramBot.Message) => void
  ): RequestId {
    const requestId = ++ServiceMessagesService.requestId;

    const unsubscribe = telegramBot.onAnyMessage((msg) => {
      if (msg.chat_shared?.request_id === requestId) {
        callback(msg.chat_shared, msg);
      }
    });

    setTimeout(() => {
      unsubscribe();
    }, maxTimeForRequest);

    return requestId;
  }
}

export const serviceMessagesService = new ServiceMessagesService();
