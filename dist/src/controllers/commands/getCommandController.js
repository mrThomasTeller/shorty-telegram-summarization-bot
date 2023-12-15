import helpCommand from '../../config/commands/help.js';
import noneCommand from '../../config/commands/none.js';
import pingCommand from '../../config/commands/ping.js';
import summarizeCommand from '../../config/commands/summarize.js';
import helpCommandController from './helpCommandController.js';
import noneCommandController from './noneCommandController.js';
import pingCommandController from './pingCommandController.js';
import summarizeCommandController from './summarizeCommandController.js';
export default function getCommandController(command) {
    switch (command.command) {
        case pingCommand.command: {
            return pingCommandController;
        }
        case summarizeCommand.command: {
            return summarizeCommandController;
        }
        case noneCommand.command: {
            return noneCommandController;
        }
        case helpCommand.command: {
            return helpCommandController;
        }
        default: {
            throw new Error(`Unknown command: ${command.command}`);
        }
    }
}
