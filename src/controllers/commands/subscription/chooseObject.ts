import type TelegramBot from 'node-telegram-bot-api';
import { getSubscriptionObjectText } from '../../../data/subscriptionUtils.ts';
import { type SubscriptionWithTariffAndChat } from '../../../services/DbService.ts';
import type TelegramBotService from '../../../services/TelegramBotService.ts';
import { makeObjectCallbackData } from './tgButtonsCallbacks.ts';
import { ObjectType } from './types/ObjectType.ts';
import { strCompare, ucFirst } from '../../../lib/string.ts';
import { getEmojiNumber } from '../../../lib/text.ts';
import { getGroupTitle } from '../../../data/dbChatUtils.ts';
import { required } from '../../../lib/lang.ts';

// todo 2sub сделать меню ссылками
export async function chooseObject({
  userSubscription,
  groupsSubscriptions,
  telegramBot,
  user,
}: {
  userSubscription: SubscriptionWithTariffAndChat | undefined;
  groupsSubscriptions: SubscriptionWithTariffAndChat[];
  telegramBot: TelegramBotService;
  user: TelegramBot.User;
}): Promise<void> {
  const options = [
    {
      description:
        '✚ Оформить новую подписку на `группу`, тогда любой участник этой группы сможет делать краткие выжимки',
      button: '✚ Новая подписка на группу',
      callback_data: makeObjectCallbackData(ObjectType.group),
    },
    userSubscription
      ? {
          description: `✏️ Редактировать ${getSubscriptionObjectText({
            subscription: userSubscription,
            grammarCase: 'acc',
            addition: 'tariffAndPrice',
            markdown: true,
          })}`,
          button: '✏️ Подписка на себя',
          callback_data: makeObjectCallbackData(ObjectType.subscription, userSubscription.id),
        }
      : {
          description:
            '✚ Оформить новую подписку на `себя`, тогда вы сможете делать краткие выжимки в любом чате \\(в котором есть Shorty\\)',
          button: '✚ Новая подписка на себя',
          callback_data: makeObjectCallbackData(ObjectType.user, user.id),
        },
    ...groupsSubscriptions
      .map((s) => ({
        description: `✏️ Редактировать ${getSubscriptionObjectText({
          subscription: s,
          grammarCase: 'acc',
          addition: 'tariffAndPrice',
          markdown: true,
        })}`,
        button: `✏️ ${ucFirst(
          getGroupTitle({ chatId: required(s.chatId, 'chatId is required'), chat: s.chat })
        )}`,
        callback_data: makeObjectCallbackData(ObjectType.subscription, s.id),
      }))
      .sort((a, b) => strCompare(a.button, b.button)),
  ];

  await telegramBot.sendMessage(
    user.id,
    `Через это меню вы можете:\n\n${options
      .map((o, i) => `${getEmojiNumber(i + 1)} ${o.description}`)
      .join('\n')}`,
    {
      parse_mode: 'MarkdownV2',
      reply_markup: {
        inline_keyboard: options.map((o, i) => [
          {
            text: `${getEmojiNumber(i + 1)} ${o.button}`,
            callback_data: o.callback_data,
          },
        ]),
      },
    }
  );
}
