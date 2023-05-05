import TelegramConnection from './lib/TelegramConnection.ts';
import { catchError } from './lib/async.ts';

async function main(): Promise<void> {
  const tg = new TelegramConnection();

  const sent = await tg.sendToAllChats(
    `🦾🤖 Бот снова вернулся к работе! Правда он не знает о тех сообщениях, которые вы посылали пока он был на обслуживании. Теперь он опять запоминает все ваши новые сообщения и с удовольствием сделает краткую выжимку для вас!`
  );

  console.log(`Сообщения отправлены в ${sent} чатов!`);

  process.exit();
}

catchError(main());