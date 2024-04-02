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
import summarizeCommandController from './summarizeCommandController.ts';
import startCommandController from './startCommandController.ts';
import sendNewsTryCommand from '../../config/commands/sendNewsTry.ts';
import sendNewsTryCommandController from './sendNewsTryCommandController.ts';
import sendNewsCommand from '../../config/commands/sendNews.ts';
import sendNewsCommandController from './sendNewsCommandController.ts';

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
    case sendNewsTryCommand.command: {
      return sendNewsTryCommandController;
    }
    case sendNewsCommand.command: {
      return sendNewsCommandController;
    }
    default: {
      throw new Error(`Unknown command: ${command.command}`);
    }
  }
}
