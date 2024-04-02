import _ from 'lodash';
import noneCommand from './none.ts';
import pingCommand from './ping.ts';
import summarizeCommand from './summarize.ts';
import type Command from './Command.ts';
import helpCommand from './help.ts';
import startCommand from './start.ts';

export const getRealCommands = (): Command[] => _.without(Object.values(commands), noneCommand);

const commands = {
  [pingCommand.command]: pingCommand,
  [summarizeCommand.command]: summarizeCommand,
  [noneCommand.command]: noneCommand,
  [helpCommand.command]: helpCommand,
  [startCommand.command]: startCommand,
};

export default commands;
