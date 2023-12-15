import { t } from '../translations/index.js';
const pingCommand = {
    command: 'ping',
    description: t('commands.ping.description'),
    whiteListOnly: false,
    allowInMaintenance: true,
};
export default pingCommand;
