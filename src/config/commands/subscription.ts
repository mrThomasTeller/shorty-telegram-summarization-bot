import { t } from '../translations/index.ts';
import type Command from './Command.ts';

const subscriptionCommand: Command = {
  command: 'subscription',
  description: t('commands.subscription.description'),
};

export default subscriptionCommand;
