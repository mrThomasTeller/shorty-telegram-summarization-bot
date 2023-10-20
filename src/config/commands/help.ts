import { t } from '../translations/index.ts';
import type Command from './Command';

const helpCommand: Command = {
  command: 'help',
  description: t('commands.help.description'),
  whiteListOnly: true,
  allowInMaintenance: true,
};

export default helpCommand;
