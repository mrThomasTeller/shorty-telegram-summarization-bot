import type Command from './Command';

// todo make integration tests for this command
const sendNewsCommand: Command = {
  command: 'sendNews',
  description: 'Отправить новости во все чаты где есть бот',
  whiteListOnly: true,
  allowInMaintenance: true,
  adminOnly: true,
};

export default sendNewsCommand;
