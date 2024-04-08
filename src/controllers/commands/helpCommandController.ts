import path from 'node:path';
import type ChatController from '../ChatController.ts';
import { dirname } from '@darkobits/fd-name';
import fs from 'node:fs';
import { required } from '../../lib/common.ts';
import _ from 'lodash';
import type TelegramBotService from '../../services/TelegramBotService';
import { escapeTelegramMarkdown } from '../../data/telegramBotMessageUtils.ts';
import printNews from '../../useCases/printNews.ts';

const helpMessageTpl = _.template(
  fs.readFileSync(path.join(required(dirname()), '../../config/texts/help.tpl'), 'utf8')
);

export const renderHelpMessage = (botName: string): string =>
  helpMessageTpl({
    botName: escapeTelegramMarkdown(botName),
  });

const helpCommandController: ChatController = ({ chat$, chatId, services }) => {
  chat$.subscribe(async () => {
    await sendHelpMessage(services.telegramBot, chatId);
    // todo вынести в конфиг после каких команд могут показываться новости
    await printNews(services.db, services.telegramBot, chatId);
  });
};

export default helpCommandController;

export async function sendHelpMessage(
  telegramBot: TelegramBotService,
  chatId: number
): Promise<void> {
  await telegramBot.sendMessage(
    chatId,
    renderHelpMessage(required(await telegramBot.getUsername())),
    {
      parse_mode: 'MarkdownV2',
    }
  );
}
