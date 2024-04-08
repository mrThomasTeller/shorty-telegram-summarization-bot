import noneCommand from './none.ts';
import pingCommand from './ping.ts';
import summarizeCommand from './summarize.ts';
import type Command from './Command.ts';
import helpCommand from './help.ts';
import startCommand from './start.ts';
import scheduleNewsCommand from './scheduleNews.ts';
import tryMessageCommand from './tryMessage.ts';

export const getVisibleCommands = (): Command[] =>
  Object.values(commands).filter((c) => c !== noneCommand && c.adminOnly !== true);

const commands = {
  [pingCommand.command]: pingCommand,
  [summarizeCommand.command]: summarizeCommand,
  [noneCommand.command]: noneCommand,
  [helpCommand.command]: helpCommand,
  [startCommand.command]: startCommand,
  [scheduleNewsCommand.command]: scheduleNewsCommand,
  [tryMessageCommand.command]: tryMessageCommand,
};

export default commands;
