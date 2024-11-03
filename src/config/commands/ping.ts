import { t } from '../translations/index';
import type Command from './Command';

const pingCommand: Command = {
  command: 'ping',
  description: t('commands.ping.description'),
  ignoreWhiteList: true,
  allowInMaintenance: true,
};

export default pingCommand;
