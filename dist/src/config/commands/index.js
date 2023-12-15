import _ from 'lodash';
import noneCommand from './none.js';
import pingCommand from './ping.js';
import summarizeCommand from './summarize.js';
import helpCommand from './help.js';
export const getRealCommands = () => _.without(Object.values(commands), noneCommand);
const commands = {
    [pingCommand.command]: pingCommand,
    [summarizeCommand.command]: summarizeCommand,
    [noneCommand.command]: noneCommand,
    [helpCommand.command]: helpCommand,
};
export default commands;
