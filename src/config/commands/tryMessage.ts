import type Command from './Command';

const tryMessageCommand: Command = {
  command: 'tryMessage',
  description: 'Отправить сообщение обратно в чат с админом, чтобы протестировать её',
  ignoreWhiteList: false,
  allowInMaintenance: true,
  adminOnly: true,
};

export default tryMessageCommand;
