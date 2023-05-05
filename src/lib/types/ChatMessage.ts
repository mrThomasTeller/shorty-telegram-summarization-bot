import { type Message } from 'node-telegram-bot-api';

type ChatMessage = Pick<Message, 'message_id' | 'text' | 'from' | 'date'>;

export default ChatMessage;
