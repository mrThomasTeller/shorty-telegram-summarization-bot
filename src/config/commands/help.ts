import { t } from '../translations/index.js';
import type Command from './Command';

const helpCommand: Command = {
  command: 'help',
  description: t('commands.help.description'),
  whiteListOnly: true,
  allowInMaintenance: false,
};

export default helpCommand;
