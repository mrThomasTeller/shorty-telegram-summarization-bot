import assert from 'assert';
// the message is in private chat with the bot or in a group chat addressed to the bot
export async function isCommandForBot(bot, message) {
    const botName = await bot.getUsername();
    assert(botName);
    return ((message.chat.type === 'private' || message.text?.includes(`@${botName}`) === true) &&
        message.text?.startsWith('/') === true);
}
