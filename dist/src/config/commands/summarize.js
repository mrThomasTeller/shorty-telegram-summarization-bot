import { t } from '../translations/index.js';
const summarizeCommand = {
    command: 'summarize',
    description: t('commands.summarize.description'),
    whiteListOnly: true,
    allowInMaintenance: false,
};
export default summarizeCommand;
