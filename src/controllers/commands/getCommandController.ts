import type Command from '../../config/commands/Command.ts';
import helpCommand from '../../config/commands/help.ts';
import noneCommand from '../../config/commands/none.ts';
import pingCommand from '../../config/commands/ping.ts';
import summarizeCommand from '../../config/commands/summarize.ts';
import type ChatController from '../ChatController.ts';
import helpCommandController from './helpCommandController.ts';
import noneCommandController from './noneCommandController.ts';
import pingCommandController from './pingCommandController.ts';
import summarizeCommandController from './summarizeCommandController.ts';
import sendNewsTryCommand from '../../config/commands/sendNewsTry.ts';
import sendNewsTryCommandController from './sendNewsTryCommandController.ts';

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
    case sendNewsTryCommand.command: {
      return sendNewsTryCommandController;
    }
    default: {
      throw new Error(`Unknown command: ${command.command}`);
    }
  }
}
