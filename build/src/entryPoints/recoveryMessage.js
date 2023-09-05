import 'dotenv/config';
import TelegramConnection from '../lib/TelegramConnection.js';
export default async function recoveryMessage(params) {
    const tg = new TelegramConnection(params.telegramBotService, params.dbService);
    const sent = await tg.sendToAllChats(`🦾🤖 Бот снова вернулся к работе! Правда он не знает о тех сообщениях, которые вы посылали пока он был на обслуживании. Теперь он опять запоминает все ваши новые сообщения и с удовольствием сделает краткую выжимку для вас!`);
    console.log(`Сообщения отправлены в ${sent} чатов!`);
    process.exit();
}
