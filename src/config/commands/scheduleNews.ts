import type Command from './Command';

// todo make integration tests for this command
const scheduleNewsCommand: Command = {
  command: 'scheduleNews',
  description: 'Отправить новости во все чаты где есть бот',
  ignoreWhiteList: false,
  allowInMaintenance: true,
  adminOnly: true,
};

export default scheduleNewsCommand;
