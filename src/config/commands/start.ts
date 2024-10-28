import { t } from '../translations/index';
import type Command from './Command';

const startCommand: Command = {
  command: 'start',
  description: t('commands.start.description'),
  ignoreWhiteList: false,
  allowInMaintenance: false,
};

export default startCommand;
