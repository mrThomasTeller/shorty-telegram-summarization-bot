import TelegramConnection from '../lib/TelegramConnection.ts';
import Store from '../lib/Store.ts';
import { isCommandForBot } from '../lib/tgUtils.ts';
import summarize from '../commands/summarize.ts';
import ping from '../commands/ping.ts';
import type EntryPoint from './EntryPoint.ts';
import { getEnv, getWhiteChatsList } from '../config/env.ts';
import type TelegramBot from 'node-telegram-bot-api';

const summarizeBotServer: EntryPoint = (params) => {
  const whiteChatsList = getWhiteChatsList();

  const tg = new TelegramConnection(params.telegramBotService, params.dbService);
  const store = new Store(params.dbService);

  tg.bot.onAnyMessage(async (msg) => {
    if (msg.text == null) return;

    const inWhiteList = whiteChatsList.includes(msg.chat.id);

    if (await isCommandForBot(tg.bot, msg)) {
      const command = msg.text.split(/ |@/)[0];

      if (command === '/log') {
        console.info(getLogMessage(msg));
        return;
      }

      if (getEnv().MODE === 'MAINTENANCE' || !inWhiteList) {
        await tg.bot.sendMessage(msg.chat.id, getMaintenanceMessage());
      } else {
        switch (command) {
          case '/summarize':
            await summarize({ telegramConnection: tg, gptService: params.gptService, store, msg });
            return;

          case '/ping':
            await ping(tg, msg);
            return;
        }
      }
    }

    if (inWhiteList && !(await store.hasMessage(msg))) {
      await store.addMessage(msg);
    }
  });

  console.info('Summarize telegram bot started');
};

export default summarizeBotServer;

export const getLogMessage = (msg: TelegramBot.Message): string =>
  `Message from chat ${msg.chat.id}, user ${String(msg.from?.id)} (${String(msg.from?.username)})`;

export const getMaintenanceMessage = (): string =>
  '😴 Бот временно отключен для технического обслуживания. Пожалуйста, попробуйте позже.';
