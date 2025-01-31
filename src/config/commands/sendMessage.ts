import type Command from './Command';

// todo make integration tests for this command
const sendMessageCommand: Command = {
  command: 'sendMessage',
  description: 'Отправить сообщение указанным пользователям от имени бота',
  ignoreWhiteList: false,
  allowInMaintenance: true,
  adminOnly: true,
};

export default sendMessageCommand;
