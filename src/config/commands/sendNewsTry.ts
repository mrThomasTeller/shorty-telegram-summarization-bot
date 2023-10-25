import type Command from './Command';

const sendNewsTryCommand: Command = {
  command: 'sendNewsTry',
  description: 'Отправить новость обратно в чат с админом, чтобы протестировать её',
  whiteListOnly: true,
  allowInMaintenance: true,
  adminOnly: true,
};

export default sendNewsTryCommand;
