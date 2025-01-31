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
import sendMessageCommand from './sendMessage';

export const getVisibleCommands = (): Command[] =>
  Object.values(commands).filter(
    (c) => c !== noneCommand && c.adminOnly !== true && c.hide !== true
  );

// todo 2sub клавиатура вместо этого
const commands = {
  [summarizeCommand.command]: summarizeCommand,
  [subscriptionCommand.command]: subscriptionCommand,
  [helpCommand.command]: helpCommand,
  [tariffCommand.command]: tariffCommand,
  [startCommand.command]: startCommand,
  [noneCommand.command]: noneCommand,
  [scheduleNewsCommand.command]: scheduleNewsCommand,
  [tryMessageCommand.command]: tryMessageCommand,
  [settingsCommand.command]: settingsCommand,
  [pingCommand.command]: pingCommand,
  [sendMessageCommand.command]: sendMessageCommand,
};

export default commands;
