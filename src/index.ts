import 'dotenv/config';
import TelegramConnection from './lib/TelegramConnection.js';
import { catchError } from './lib/async.js';
import Store from './lib/Store.js';
import { isCommandForBot } from './lib/tgUtils.js';
import summarize from './commands/summarize.js';

catchError(main());

async function main(): Promise<void> {
  const tg = new TelegramConnection();
  const store = new Store();

  tg.bot.onText(/.*/, async (msg) => {
    if (msg.text == null) return;

    if (await isCommandForBot(tg.bot, msg)) {
      if (msg.text.startsWith('/summarize')) {
        await summarize(tg, msg);
      }
    } else if (!(await store.hasMessage(msg))) {
      await store.addMessage(msg);
    }
  });

  console.log('Summarize telegram bot started');
}
