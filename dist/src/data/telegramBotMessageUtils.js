export function parseCommand(message) {
    const [command, target] = (message.text ?? '').split(/ |@/);
    if (command?.startsWith('/') === true) {
        return { command: command.slice(1), target };
    }
    return undefined;
}
// the message is in private chat with the bot or in a group chat addressed to the bot
export function isCommandForBot(parsedCommand, message, botName) {
    return message.chat.type === 'private' || parsedCommand.target === botName;
}
