import { t } from '../translations/index.ts';
import type Command from './Command';

const tariffCommand: Command = {
  command: 'tariff',
  description: t('commands.tariff.description'),
  whiteListOnly: false,
  allowInMaintenance: true,
};

export default tariffCommand;
