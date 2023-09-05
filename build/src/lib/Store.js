class Store {
    dbService;
    constructor(dbService) {
        this.dbService = dbService;
    }
    async addMessage(msg) {
        const user = msg.from === undefined
            ? undefined
            : await this.dbService.getOrCreateUser({
                id: msg.from.id,
                firstName: msg.from.first_name,
                lastName: msg.from.last_name,
                username: msg.from.username,
            });
        const chat = await this.dbService.getOrCreateChat(msg.chat.id);
        await this.dbService.createChatMessageIfNotExists({
            messageId: msg.message_id,
            chatId: chat.id,
            text: msg.text,
            date: new Date(msg.date * 1000),
            userId: user?.id,
        });
    }
    getChatMessages(chatId, fromDate) {
        return this.dbService.getChatMessages(Number(chatId), fromDate);
    }
    hasMessage(msg) {
        return this.dbService.hasMessage(msg.message_id, msg.chat.id);
    }
}
export default Store;
