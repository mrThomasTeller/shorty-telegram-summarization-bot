import { t } from '../translations/index.ts';
import type Command from './Command.ts';

const subscribeCommand: Command = {
  command: 'subscribe',
  description: t('commands.subscribe.description'),
  privateChatOnly: true,
};

export default subscribeCommand;
