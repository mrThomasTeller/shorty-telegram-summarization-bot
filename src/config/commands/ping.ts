import { t } from '../translations/index.js';
import type Command from './Command';

const pingCommand: Command = {
  command: 'ping',
  description: t('commands.ping.description'),
  whiteListOnly: false,
  allowInMaintenance: true,
};

export default pingCommand;
