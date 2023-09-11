import { t } from '../translations/index.ts';
import type Command from './Command';

const pingCommand: Command = {
  command: 'ping',
  description: t('commands.ping.description'),
  whiteListOnly: false,
  allowInMaintenance: true,
};

export default pingCommand;
