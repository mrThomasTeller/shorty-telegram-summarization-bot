import TelegramConnection from './lib/TelegramConnection.js';

async function main() {
  const tg = new TelegramConnection();

  const sent = await tg.sendToAllChats(
    `🦾🤖 Бот снова вернулся к работе! Правда он не знает о тех сообщениях, которые вы посылали пока он был на обслуживании. Он запоминает все ваши новые сообщения и с удовольствием сделает краткую выжимку для вас!`
  );

  console.log(`Сообщения отправлены в ${sent} чатов!`);

  process.exit();
}

main();
