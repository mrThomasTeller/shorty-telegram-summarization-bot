import { t } from '../translations/index';
import type Command from './Command';

const settingsCommand: Command = {
  command: 'settings',
  description: t('commands.settings.description'),
  ignoreWhiteList: true,
  allowInMaintenance: false,
  hide: true,
};

export default settingsCommand;
