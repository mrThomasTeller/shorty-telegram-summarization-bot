import type Command from '../../config/commands/Command.ts';
import type ChatController from '../ChatController.ts';
import noneCommandController from './noneCommandController.ts';
import pingCommandController from './pingCommandController.ts';
import summarizeCommandController from './summarizeCommandController.ts';

export default function getCommandController(command: Command): ChatController {
  switch (command.command) {
    case 'ping': {
      return pingCommandController;
    }
    case 'summarize': {
      return summarizeCommandController;
    }
    default: {
      return noneCommandController;
    }
  }
}
