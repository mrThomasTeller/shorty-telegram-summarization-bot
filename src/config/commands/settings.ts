import { t } from '../translations/index.ts';
import type Command from './Command.ts';

const settingsCommand: Command = {
  command: 'settings',
  description: t('commands.settings.description'),
  whiteListOnly: false,
  allowInMaintenance: false,
  hide: true,
};

export default settingsCommand;
