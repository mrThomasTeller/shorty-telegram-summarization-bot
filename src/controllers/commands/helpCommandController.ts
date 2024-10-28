import path from 'node:path';
import type ChatController from '../ChatController.ts';
import { dirname } from '@darkobits/fd-name';
import fs from 'node:fs';
import { required } from '../../lib/common/lang.ts';
import _ from 'lodash';
import type TelegramBotService from '../../services/TelegramBotService';
import { escapeTelegramMarkdown } from '../../data/telegramBotMessageUtils.ts';
import logger from '../../config/logger.ts';
import { getEnv } from '../../config/envVars.ts';
import { t } from '../../config/translations/index.ts';

const helpMessageTpl = _.template(
  fs.readFileSync(path.join(required(dirname()), '../../config/texts/help.tpl'), 'utf8')
);

export const renderHelpMessage = (botName: string, chatId: number): string =>
  helpMessageTpl({
    botName: escapeTelegramMarkdown(botName),
    chatId,
    maxFreeSummariesPerWeek: t('shared.freeSummariesCount', {
      count: getEnv().MAX_SUMMARIES_PER_WEEK,
    }),
  });

const helpCommandController: ChatController = ({ chat$, chatId, services }) => {
  chat$.subscribe(async () => {
    try {
      await sendHelpMessage(services.telegramBot, chatId);
    } catch (error) {
      logger.error('Error in helpCommandController', error);
    }
  });
};

export default helpCommandController;

export async function sendHelpMessage(
  telegramBot: TelegramBotService,
  chatId: number
): Promise<void> {
  await telegramBot.sendMessage(
    chatId,
    renderHelpMessage(required(await telegramBot.getUsername()), chatId),
    {
      parse_mode: 'MarkdownV2',
    }
  );
}
