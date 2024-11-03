import { t } from '../translations/index';
import type Command from './Command';

const subscriptionCommand: Command = {
  command: 'subscription',
  description: t('commands.subscription.description'),
};

export default subscriptionCommand;
