class TelegramConnection {
    bot;
    dbService;
    constructor(bot, dbService) {
        this.bot = bot;
        this.dbService = dbService;
    }
    async sendToAllChats(text) {
        const chats = await this.dbService.getAllChats();
        let count = 0;
        for (const chat of chats) {
            try {
                await this.bot.sendMessage(Number(chat.id), text);
                count += 1;
            }
            catch (error) {
                if (error instanceof Error) {
                    console.error(`Не могу отправить сообщение: ${error.message}`);
                }
            }
        }
        return count;
    }
}
export default TelegramConnection;
