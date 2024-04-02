import { t } from '../translations/index.ts';
import type Command from './Command';

const startCommand: Command = {
  command: 'start',
  description: t('commands.start.description'),
  whiteListOnly: true,
  allowInMaintenance: false,
};

export default startCommand;
