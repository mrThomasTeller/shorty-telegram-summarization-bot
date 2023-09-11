import TelegramConnection from '../lib/TelegramConnection';
import { type EntryPointParams } from './EntryPoint';

export default async function recoveryMessage(params: EntryPointParams): Promise<void> {
  const tg = new TelegramConnection(params.telegramBotService, params.dbService);

  const sent = await tg.sendToAllChats(getRecoveryMessage());

  console.info(getRecoveryMessagesSentInfoMessage(sent));
}

export const getRecoveryMessage = (): string =>
  `🦾🤖 Бот снова вернулся к работе! Правда он не знает о тех сообщениях, которые вы посылали пока он был на обслуживании. Теперь он опять запоминает все ваши новые сообщения и с удовольствием сделает краткую выжимку для вас!`;

export const getRecoveryMessagesSentInfoMessage = (sent: number): string =>
  `Сообщения отправлены в ${sent} чатов!`;
