import _ from 'lodash';
import noneCommand from './none.ts';
import pingCommand from './ping.ts';
import summarizeCommand from './summarize.ts';
import type Command from './Command.ts';

export const getRealCommands = (): Command[] => _.without(Object.values(commands), noneCommand);

const commands = {
  [pingCommand.command]: pingCommand,
  [summarizeCommand.command]: summarizeCommand,
  [noneCommand.command]: noneCommand,
};

export default commands;
