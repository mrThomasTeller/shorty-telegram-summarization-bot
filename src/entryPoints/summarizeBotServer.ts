import TelegramConnection from '../lib/TelegramConnection.js';
import Store from '../lib/Store.js';
import { isCommandForBot } from '../lib/tgUtils.js';
import summarize from '../commands/summarize.js';
import ping from '../commands/ping.js';
import { type EntryPointParams } from './EntryPoint.js';
import { getEnv, getWhiteChatsList } from '../config/env.js';
import type TelegramBot from 'node-telegram-bot-api';

export default async function summarizeBotServer(params: EntryPointParams): Promise<void> {
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
}

export const getLogMessage = (msg: TelegramBot.Message): string =>
  `Message from chat ${msg.chat.id}, user ${String(msg.from?.id)} (${String(msg.from?.username)})`;

export const getMaintenanceMessage = (): string =>
  '😴 Бот временно отключен для технического обслуживания. Пожалуйста, попробуйте позже.';
