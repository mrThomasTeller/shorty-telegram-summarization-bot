import path from 'node:path';
import type ChatController from '../ChatController.ts';
import { dirname } from '@darkobits/fd-name';
import fs from 'node:fs';
import { required } from '../../lib/common.ts';
import _ from 'lodash';
import type TelegramBotService from '../../services/TelegramBotService';
import { escapeTelegramMarkdown } from '../../data/telegramBotMessageUtils.ts';

const startMessageTpl = _.template(
  fs.readFileSync(path.join(required(dirname()), '../../config/texts/start.tpl'), 'utf8')
);

export const renderStartMessage = (botName: string): string =>
  startMessageTpl({
    botName: escapeTelegramMarkdown(botName),
  });

const startCommandController: ChatController = ({ chat$, chatId, services }) => {
  chat$.subscribe(() => sendStartMessage(services.telegramBot, chatId));
};

export default startCommandController;

export async function sendStartMessage(
  telegramBot: TelegramBotService,
  chatId: number
): Promise<void> {
  await telegramBot.sendMessage(
    chatId,
    renderStartMessage(required(await telegramBot.getUsername())),
    {
      parse_mode: 'MarkdownV2',
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Добавить в групповой чат', url: 'https://t.me/SummarizeBot?startgroup=true' }],
        ],
      },
    }
  );
}
