import { t } from '../translations/index.ts';
import type Command from './Command';

const summarizeCommand: Command = {
  command: 'summarize',
  description: t('commands.summarize.description'),
  ignoreWhiteList: false,
  allowInMaintenance: false,
};

export default summarizeCommand;
