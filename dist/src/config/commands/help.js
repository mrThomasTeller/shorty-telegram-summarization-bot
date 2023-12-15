import { t } from '../translations/index.js';
const helpCommand = {
    command: 'help',
    description: t('commands.help.description'),
    whiteListOnly: true,
    allowInMaintenance: false,
};
export default helpCommand;
