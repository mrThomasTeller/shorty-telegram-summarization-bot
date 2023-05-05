import { type Message, type User } from '@prisma/client';

type ChatMessage = Message & { from: User | null };

export default ChatMessage;
