import { t } from '../translations/index';
import type Command from './Command';

const tariffCommand: Command = {
  command: 'tariff',
  description: t('commands.tariff.description'),
  ignoreWhiteList: true,
  allowInMaintenance: true,
};

export default tariffCommand;
