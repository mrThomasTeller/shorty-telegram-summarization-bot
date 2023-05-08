import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
class Store {
    async addMessage(msg) {
        const user = msg.from === undefined
            ? undefined
            : await prisma.user.upsert({
                where: { id: msg.from.id },
                update: {},
                create: {
                    id: msg.from.id,
                    firstName: msg.from.first_name,
                    lastName: msg.from.last_name,
                    username: msg.from.username,
                },
            });
        const chat = await prisma.chat.upsert({
            where: { id: Number(msg.chat.id) },
            update: {},
            create: { id: Number(msg.chat.id) },
        });
        await prisma.message.upsert({
            where: { id: msg.message_id },
            update: {},
            create: {
                id: msg.message_id,
                text: msg.text,
                date: new Date(msg.date * 1000),
                userId: user?.id,
                chatId: chat.id,
            },
        });
    }
    async getChatMessages(chatId, fromDate) {
        return await prisma.message.findMany({
            where: {
                chatId: Number(chatId),
                date: fromDate !== undefined ? { gte: fromDate } : undefined,
            },
            include: {
                from: true,
            },
        });
    }
    async hasMessage(messageId) {
        return ((await prisma.message.findUnique({
            where: { id: messageId },
        })) !== null);
    }
    async removeMessagesBeforeDate(date) {
        await prisma.message.deleteMany({
            where: {
                date: { lt: date },
            },
        });
    }
}
export default Store;
