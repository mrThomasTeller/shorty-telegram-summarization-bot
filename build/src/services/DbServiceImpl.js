import { PrismaClient } from '@prisma/client';
export default class DbServiceImpl {
    prisma;
    constructor() {
        this.prisma = new PrismaClient();
    }
    async createChatMessageIfNotExists(msg) {
        await this.prisma.message.upsert({
            where: {
                messageId_chatId: {
                    messageId: msg.messageId,
                    chatId: msg.chatId,
                },
            },
            update: {},
            create: msg,
        });
    }
    getAllChats() {
        return this.prisma.chat.findMany();
    }
    getChatMessages(chatId, fromDate) {
        return this.prisma.message.findMany({
            where: {
                chatId,
                date: fromDate !== undefined ? { gte: fromDate } : undefined,
            },
            include: {
                from: true,
            },
        });
    }
    getOrCreateChat(chatId) {
        return this.prisma.chat.upsert({
            where: { id: chatId },
            update: {},
            create: { id: chatId },
        });
    }
    getOrCreateUser(user) {
        return this.prisma.user.upsert({
            where: { id: user.id },
            update: {},
            create: user,
        });
    }
    async hasMessage(messageId, chatId) {
        const message = await this.prisma.message.findUnique({
            where: {
                messageId_chatId: {
                    messageId,
                    chatId,
                },
            },
        });
        return message !== null;
    }
}
