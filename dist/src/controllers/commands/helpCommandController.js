import path from 'node:path';
import summarizeCommand from '../../config/commands/summarize.js';
import { dirname } from '@darkobits/fd-name';
import fs from 'node:fs';
import { required } from '../../lib/common.js';
import _ from 'lodash';
import { escapeTelegramMarkdown } from '../../lib/tgUtils.js';
const helpMessageTpl = _.template(fs.readFileSync(path.join(required(dirname()), '../../config/texts/help.tpl'), 'utf8'));
export const renderHelpMessage = (botName) => helpMessageTpl({
    summarizeCommand: summarizeCommand.command,
    botName: escapeTelegramMarkdown(botName),
});
// todo make html template
const helpCommandController = ({ chat$, chatId, services }) => {
    chat$.subscribe(() => sendHelpMessage(services.telegramBot, chatId));
};
export default helpCommandController;
export async function sendHelpMessage(telegramBot, chatId) {
    await telegramBot.sendMessage(chatId, renderHelpMessage(required(await telegramBot.getUsername())), {
        parse_mode: 'MarkdownV2',
    });
}
