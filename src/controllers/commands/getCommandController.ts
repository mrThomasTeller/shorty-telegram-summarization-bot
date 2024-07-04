import type Command from '../../config/commands/Command.ts';
import helpCommand from '../../config/commands/help.ts';
import noneCommand from '../../config/commands/none.ts';
import pingCommand from '../../config/commands/ping.ts';
import summarizeCommand from '../../config/commands/summarize.ts';
import startCommand from '../../config/commands/start.ts';
import type ChatController from '../ChatController.ts';
import helpCommandController from './helpCommandController.ts';
import noneCommandController from './noneCommandController.ts';
import pingCommandController from './pingCommandController.ts';
import summarizeCommandController from './summarize/summarizeCommandController.ts';
import startCommandController from './startCommandController.ts';
import tryMessageCommand from '../../config/commands/tryMessage.ts';
import tryMessageCommandController from './tryMessageCommandController.ts';
import scheduleNewsCommand from '../../config/commands/scheduleNews.ts';
import scheduleNewsCommandController from './scheduleNewsCommandController.ts';
import tariffCommand from '../../config/commands/tariff.ts';
import tariffCommandController from './tariffCommandController.ts';
import activateCommand from '../../config/commands/activate.ts';
import activateCommandController from './activateCommandController.ts';
import settingsCommand from '../../config/commands/settings.ts';
import settingsCommandController from './settingsCommandController.ts';

export default function getCommandController(command: Command): ChatController {
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
    case startCommand.command: {
      return startCommandController;
    }
    case tryMessageCommand.command: {
      return tryMessageCommandController;
    }
    case scheduleNewsCommand.command: {
      return scheduleNewsCommandController;
    }
    case tariffCommand.command: {
      return tariffCommandController;
    }
    case activateCommand.command: {
      return activateCommandController;
    }
    case settingsCommand.command: {
      return settingsCommandController;
    }
    default: {
      throw new Error(`Unknown command: ${command.command}`);
    }
  }
}
