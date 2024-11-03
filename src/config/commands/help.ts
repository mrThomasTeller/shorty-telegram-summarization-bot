import { t } from '../translations/index';
import type Command from './Command';

const helpCommand: Command = {
  command: 'help',
  description: t('commands.help.description'),
};

export default helpCommand;
