import type TelegramBotService from '../../../services/TelegramBotService.ts';

export async function subscribeFromGroupInstructions(
  telegramBot: TelegramBotService,
  userId: number,
  action: 'subscribe' | 'changeGroup'
): Promise<void> {
  const botName = await telegramBot.getUsername();
  await telegramBot.sendMessage(
    userId,
    `👉 Для того, чтобы ${
      action === 'subscribe' ? 'оформить подписку' : 'переключить подписку'
    } на новую группу:

1️⃣ Добавьте меня в эту новую группу \\(можно нажать на кнопку ниже\\)

2️⃣ В новой группе отправьте команду \\(кликните, чтобы скопировать\\):
\`/subscription@${botName}\``,
    {
      parse_mode: 'MarkdownV2',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Добавить в групповой чат',
              url: `https://t.me/${botName}?startgroup=true`,
            },
          ],
        ],
      },
    }
  );
}
