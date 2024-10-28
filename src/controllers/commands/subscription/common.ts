import type TelegramBotService from '../../../services/TelegramBotService';

// todo 2sub пользователю потом придётся заново выбирать группу с которой переключить подписку
// надо упростить этот процесс
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

1️⃣ Скопируйте эту команду \\(кликните по ней, чтобы скопировать\\):
\`/subscription@${botName}\`

2️⃣ Добавьте меня в новую группу если ещё этого не сделали \\(можно нажать на кнопку ниже\\)

3️⃣ В новой группе отправьте скопированную на первом шаге команду

4️⃣ Нажмите на кнопку "⭐️ Оформить подписку"`,
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
