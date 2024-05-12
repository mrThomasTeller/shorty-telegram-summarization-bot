import { t } from '../translations/index.ts';
import type Command from './Command.ts';

const activateCommand: Command = {
  command: 'activate',
  description: t('commands.activate.description'),
  whiteListOnly: false,
  allowInMaintenance: false,
  hide: true,
};

export default activateCommand;
