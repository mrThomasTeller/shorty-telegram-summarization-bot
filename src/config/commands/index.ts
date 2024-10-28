import noneCommand from './none';
import pingCommand from './ping';
import summarizeCommand from './summarize';
import type Command from './Command';
import helpCommand from './help';
import startCommand from './start';
import scheduleNewsCommand from './scheduleNews';
import tryMessageCommand from './tryMessage';
import tariffCommand from './tariff';
import settingsCommand from './settings';
import subscriptionCommand from './subscription';

export const getVisibleCommands = (): Command[] =>
  Object.values(commands).filter(
    (c) => c !== noneCommand && c.adminOnly !== true && c.hide !== true
  );

// fixme sub клавиатура вместо этого
const commands = {
  [subscriptionCommand.command]: subscriptionCommand,
  [pingCommand.command]: pingCommand,
  [summarizeCommand.command]: summarizeCommand,
  [noneCommand.command]: noneCommand,
  [helpCommand.command]: helpCommand,
  [startCommand.command]: startCommand,
  [scheduleNewsCommand.command]: scheduleNewsCommand,
  [tryMessageCommand.command]: tryMessageCommand,
  [tariffCommand.command]: tariffCommand,
  [settingsCommand.command]: settingsCommand,
};

export default commands;
