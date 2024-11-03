import type TelegramBot from 'node-telegram-bot-api';
import { required } from '../../../lib/common/lang';
import type DbService from '../../../services/DbService';
import { serviceMessagesService } from '../../../services/ServiceMessagesService';
import type TelegramBotService from '../../../services/TelegramBotService';
import { chooseTariff } from './chooseTariff';
import { ObjectType } from './types/ObjectType';

export async function chooseGroup({
  db,
  telegramBot,
  userId,
}: // action,
// subscriptionId,
{
  db: DbService;
  telegramBot: TelegramBotService;
  userId: number;
  // action: 'subscribe' | 'changeGroup';
  // subscriptionId?: bigint;
}): Promise<void> {
  // todo 2sub как добавить?
  const requestChat = (isChannel: boolean): TelegramBot.KeyboardButtonRequestChat => ({
    request_id: serviceMessagesService.registerChatRequest(telegramBot, async (chatShared, msg) => {
      const isInChat = await telegramBot.isInChat(chatShared.chat_id);
      // eslint-disable-next-line unicorn/prefer-ternary
      if (isInChat) {
        await chooseTariff({
          db,
          telegramBot,
          user: required(msg.from, 'user is required'),
          object: ObjectType.group,
          id: BigInt(chatShared.chat_id),
        });
      } else {
        await telegramBot.sendMessage(
          userId,
          '⚠️ Shorty не является участником этого чата. Пожалуйста, добавьте его, a затем попробуйте снова.',
          { reply_markup: { remove_keyboard: false } }
        );
      }
    }),
    chat_is_channel: isChannel,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    user_administrator_rights: { can_manage_chat: true } as any,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    request_title: true,
  });

  await telegramBot.sendMessage(
    userId,
    `❓ Выберите группу или канал\\. Shorty обязательно должен быть добавлен туда как участник\\.

⚠️ _Обратите внимание, что выбор группы/канала не работает в веб\\-версии Telegram\\. Используйте мобильное или десктопное приложение\\. Также эта функция не работает в устаревших версиях Telegram\\._`,
    {
      parse_mode: 'MarkdownV2',
      reply_markup: {
        keyboard: [
          [
            {
              text: '👥 Выбрать групповой чат',
              request_chat: requestChat(false),
            },
          ],
          [
            {
              text: '📣 Выбрать канал',
              request_chat: requestChat(true),
            },
          ],
          // todo 2sub реализовать эти кнопки
          // [
          //   {
          //     text: '🚫 Отмена',
          //   },
          // ],
          // [
          //   {
          //     text: '❓ Мне нужна помощь',
          //   },
          // ],
        ],
      },
    }
  );
}
