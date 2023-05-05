import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { EOL } from 'os';
import { PrismaClient } from '@prisma/client';
import Store from '../lib/Store.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const chatsDir = path.join(__dirname, '../../chats');
const prisma = new PrismaClient();
const store = new Store();
async function migrateFilesToDatabase() {
    const chatsFiles = await fs.promises.readdir(chatsDir);
    for (const chatIdStr of chatsFiles) {
        const chatId = Number(chatIdStr);
        const chatMessagesText = await fs.promises.readFile(path.join(chatsDir, chatIdStr), 'utf-8');
        const chatMessages = chatMessagesText
            .split(EOL)
            .filter((row) => row !== '')
            .map((row) => JSON.parse(row));
        for (const message of chatMessages) {
            await store.addMessage(chatId, message);
        }
        console.log(`Миграция сообщений чата ${chatId} завершена.`);
    }
    console.log('Миграция всех сообщений завершена.');
}
migrateFilesToDatabase()
    .catch((error) => {
    console.error('Ошибка при миграции:', error);
})
    .finally(() => {
    return prisma.$disconnect();
});
