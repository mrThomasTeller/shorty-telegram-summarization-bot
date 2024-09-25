import noneCommand from './none.ts';
import pingCommand from './ping.ts';
import summarizeCommand from './summarize.ts';
import type Command from './Command.ts';
import helpCommand from './help.ts';
import startCommand from './start.ts';
import scheduleNewsCommand from './scheduleNews.ts';
import tryMessageCommand from './tryMessage.ts';
import tariffCommand from './tariff.ts';
import activateCommand from './activate.ts';
import settingsCommand from './settings.ts';
import subscribeCommand from './subscribe.ts';

export const getVisibleCommands = (): Command[] =>
  Object.values(commands).filter(
    (c) => c !== noneCommand && c.adminOnly !== true && c.hide !== true
  );

const commands = {
  [pingCommand.command]: pingCommand,
  [summarizeCommand.command]: summarizeCommand,
  [noneCommand.command]: noneCommand,
  [helpCommand.command]: helpCommand,
  [startCommand.command]: startCommand,
  [scheduleNewsCommand.command]: scheduleNewsCommand,
  [tryMessageCommand.command]: tryMessageCommand,
  [tariffCommand.command]: tariffCommand,
  [activateCommand.command]: activateCommand,
  [settingsCommand.command]: settingsCommand,
  [subscribeCommand.command]: subscribeCommand,
};

export default commands;
