import { t } from '../translations/index.ts';
import type Command from './Command';

const summarizeCommand: Command = {
  command: 'summarize',
  description: t('commands.summarize.description'),
  whiteListOnly: true,
  allowInMaintenance: false,
};

export default summarizeCommand;
