import { t } from '../translations/index';
import type Command from './Command';

// fixme group only
const summarizeCommand: Command = {
  command: 'summarize',
  description: t('commands.summarize.description'),
  ignoreWhiteList: false,
  allowInMaintenance: false,
};

export default summarizeCommand;
