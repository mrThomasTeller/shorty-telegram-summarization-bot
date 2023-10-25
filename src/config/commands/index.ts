import noneCommand from './none.ts';
import pingCommand from './ping.ts';
import summarizeCommand from './summarize.ts';
import type Command from './Command.ts';
import helpCommand from './help.ts';
import sendNewsCommand from './sendNews.ts';
import sendNewsTryCommand from './sendNewsTry.ts';

export const getVisibleCommands = (): Command[] =>
  Object.values(commands).filter((c) => c !== noneCommand && c.adminOnly !== true);

const commands = {
  [pingCommand.command]: pingCommand,
  [summarizeCommand.command]: summarizeCommand,
  [noneCommand.command]: noneCommand,
  [helpCommand.command]: helpCommand,
  [sendNewsCommand.command]: sendNewsCommand,
  [sendNewsTryCommand.command]: sendNewsTryCommand,
};

export default commands;
