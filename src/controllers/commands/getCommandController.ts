import type Command from '../../config/commands/Command';
import helpCommand from '../../config/commands/help';
import noneCommand from '../../config/commands/none';
import pingCommand from '../../config/commands/ping';
import summarizeCommand from '../../config/commands/summarize';
import startCommand from '../../config/commands/start';
import type ChatController from '../ChatController';
import helpCommandController from './helpCommandController';
import noneCommandController from './noneCommandController';
import pingCommandController from './pingCommandController';
import summarizeCommandController from './summarize/summarizeCommandController';
import startCommandController from './startCommandController';
import tryMessageCommand from '../../config/commands/tryMessage';
import tryMessageCommandController from './tryMessageCommandController';
import scheduleNewsCommand from '../../config/commands/scheduleNews';
import scheduleNewsCommandController from './scheduleNewsCommandController';
import tariffCommand from '../../config/commands/tariff';
import tariffCommandController from './tariffCommandController';
import settingsCommand from '../../config/commands/settings';
import settingsCommandController from './settingsCommandController';
import subscriptionCommand from '../../config/commands/subscription';
import subscriptionCommandController from './subscription/subscriptionCommandController';
import sendMessageCommand from '../../config/commands/sendMessage';
import sendMessageCommandController from './sendMessageCommandController';

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
    case settingsCommand.command: {
      return settingsCommandController;
    }
    case subscriptionCommand.command: {
      return subscriptionCommandController;
    }
    case sendMessageCommand.command: {
      return sendMessageCommandController;
    }
    default: {
      throw new Error(`Unknown command: ${command.command}`);
    }
  }
}
