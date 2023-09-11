import type Command from './Command';

// todo fairly it's not a command, I need rename Command to something else (MessageType?)
const noneCommand: Command = {
  command: '',
  description: '',
  whiteListOnly: true,
  allowInMaintenance: true,
};

export default noneCommand;
