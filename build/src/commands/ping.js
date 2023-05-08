import packageJson from '../../package.json' assert { type: 'json' };
export default async function ping(telegramConnection, msg) {
    await telegramConnection.bot.sendMessage(msg.chat.id, `
💻 Бот тут
Environment: ${process.env.NODE_ENV ?? 'unknown'}
Version: ${packageJson.version}
`.trim());
}
