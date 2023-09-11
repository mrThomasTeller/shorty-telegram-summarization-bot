import type TelegramBot from 'node-telegram-bot-api';
import { type Observable } from 'rxjs';
import type Services from '../services/Services';

type ChatControllerPrams = {
  chat$: Observable<TelegramBot.Message>;
  chatId: number;
  services: Services;
};

type ChatController = (params: ChatControllerPrams) => void;

export default ChatController;
