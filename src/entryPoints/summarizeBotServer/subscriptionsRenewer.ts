import { setTimeout } from 'node:timers/promises';
import config from '../../config/config.ts';
import type DbService from '../../services/DbService.ts';
import type TelegramBotService from '../../services/TelegramBotService.ts';
import type EntryPoint from '../EntryPoint';
import { ukassaService } from '../../services/UKassaService/UKassaService.ts';

export const subscriptionsRenewer: EntryPoint = async ({ db, telegramBot }) => {
  // await checkSubscriptions({ db, telegramBot });
  // setInterval(async () => {
  //   await checkSubscriptions({ db, telegramBot });
  // }, config.subscriptions.checkInterval);

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  while (true) {
    await checkSubscriptions({ db, telegramBot });
    await setTimeout(config.subscriptions.checkInterval);
  }
};

async function checkSubscriptions({
  db,
  telegramBot,
}: {
  db: DbService;
  telegramBot: TelegramBotService;
}): Promise<void> {
  // const subscriptions = await db.getAllSubscriptions();
  // for (const subscription of subscriptions) {
  //   const now = new Date();
  //   if (subscription.expires > now) {
  //     ukassaService.createPayment();
  //   }
  // }
}
