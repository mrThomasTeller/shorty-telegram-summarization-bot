import { PrismaClient, } from '@prisma/client';
import _ from 'lodash';
export default class DbServiceImpl {
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
    createSummary(chatId, date) {
        return this.prisma.summary.create({
            data: {
                chatId,
                date,
            },
        });
    }
    getAllChats() {
        return this.prisma.chat.findMany();
    }
    getChatMessages(chatId, fromDate) {
        return this.prisma.message.findMany({
            where: {
                chatId,
                date: fromDate === undefined ? undefined : { gte: fromDate },
            },
            include: {
                from: true,
            },
        });
    }
    async getSummariesFrom(chatId, date) {
        const summaries = await this.prisma.summary.findMany({
            where: {
                chatId,
                date: { gte: date },
            },
            orderBy: {
                date: 'desc',
            },
        });
        return _.sortBy(summaries, 'date');
    }
    async getOrCreateChat(chatId) {
        const chat = await this.prisma.chat.findUnique({ where: { id: chatId } });
        return chat === null
            ? [await this.prisma.chat.create({ data: { id: chatId } }), true]
            : [chat, false];
    }
    async getOrCreateUser(userInput) {
        const user = await this.prisma.user.findUnique({
            where: { id: userInput.id },
        });
        return user === null
            ? [await this.prisma.user.create({ data: userInput }), true]
            : [user, false];
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
