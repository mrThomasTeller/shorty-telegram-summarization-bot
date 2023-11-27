import path from 'node:path';
import summarizeCommand from '../../config/commands/summarize.ts';
import type ChatController from '../ChatController.ts';
import { dirname } from '@darkobits/fd-name';
import fs from 'node:fs';
import { required } from '../../lib/common.ts';
import _ from 'lodash';
import { escapeTelegramMarkdown } from '../../lib/tgUtils.ts';
import type TelegramBotService from '../../services/TelegramBotService';

const helpMessageTpl = _.template(
  fs.readFileSync(path.join(required(dirname()), '../../config/texts/help.tpl'), 'utf8')
);

export const renderHelpMessage = (botName: string): string =>
  helpMessageTpl({
    summarizeCommand: summarizeCommand.command,
    botName: escapeTelegramMarkdown(botName),
  });

// todo make html template
const helpCommandController: ChatController = ({ chat$, chatId, services }) => {
  chat$.subscribe(() => sendHelpMessage(services.telegramBot, chatId));
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
