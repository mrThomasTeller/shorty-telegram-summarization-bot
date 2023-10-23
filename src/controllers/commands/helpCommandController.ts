import path from 'node:path';
import summarizeCommand from '../../config/commands/summarize.ts';
import { getEnv } from '../../config/envVars.ts';
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

export const renderHelpMessage = (): string =>
  helpMessageTpl({
    summarizeCommand: summarizeCommand.command,
    botName: escapeTelegramMarkdown(getEnv().BOT_NAME),
  });

// todo make html template
const helpCommandController: ChatController = ({ chat$, chatId, services }) => {
  chat$.subscribe(() => sendHelpMessage(services.telegramBot, chatId));
};

export default helpCommandController;

export const sendHelpMessage = (telegramBot: TelegramBotService, chatId: number): Promise<void> =>
  telegramBot.sendMessage(chatId, renderHelpMessage(), {
    parse_mode: 'MarkdownV2',
  });
