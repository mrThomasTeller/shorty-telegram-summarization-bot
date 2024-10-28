import path from 'node:path';
import type ChatController from '../ChatController';
import { dirname } from '@darkobits/fd-name';
import fs from 'node:fs';
import { required } from '../../lib/common/lang';
import _ from 'lodash';
import type TelegramBotService from '../../services/TelegramBotService';
import { escapeTelegramMarkdown } from '../../data/telegramBotMessageUtils';
import logger from '../../config/logger';

const startMessageTpl = _.template(
  fs.readFileSync(path.join(required(dirname()), '../../config/texts/start.tpl'), 'utf8')
);

export const renderStartMessage = (botName: string): string =>
  startMessageTpl({
    botName: escapeTelegramMarkdown(botName),
  });

const startCommandController: ChatController = ({ chat$, chatId, services }) => {
  chat$.subscribe(async () => {
    try {
      await sendStartMessage(services.telegramBot, chatId);
    } catch (error) {
      logger.error('Error in startCommandController', error);
    }
  });
};

export default startCommandController;

export async function sendStartMessage(
  telegramBot: TelegramBotService,
  chatId: number
): Promise<void> {
  const botName = await telegramBot.getUsername();

  await telegramBot.sendMessage(
    chatId,
    renderStartMessage(required(await telegramBot.getUsername())),
    {
      parse_mode: 'MarkdownV2',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Добавить в групповой чат',
              url: `https://t.me/${botName}?startgroup=true`,
            },
          ],
        ],
      },
    }
  );
}
