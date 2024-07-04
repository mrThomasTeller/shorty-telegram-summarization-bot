import { type Message, type User } from '@prisma/client';

type DbChatMessage = Message & { from: User | null };

export default DbChatMessage;
