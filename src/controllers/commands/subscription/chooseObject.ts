import _ from 'lodash';
import type TelegramBot from 'node-telegram-bot-api';
import { getGroupTitle } from '../../../data/dbChatUtils.ts';
import { getSubscriptionObjectText } from '../../../data/subscriptionUtils.ts';
import { required } from '../../../lib/common/lang.ts';
import { strCompare, ucFirst } from '../../../lib/common/string.ts';
import { getEmojiNumber } from '../../../lib/common/text.ts';
import type DbService from '../../../services/DbService.ts';
import { type SubscriptionWithTariffAndChat } from '../../../services/DbService.ts';
import type TelegramBotService from '../../../services/TelegramBotService.ts';
import { makeObjectCallbackData } from './tgButtonsCallbacks.ts';
import { ObjectType } from './types/ObjectType.ts';
import { getPrivateCommandUrl } from '../../../data/telegramBotMessageUtils.ts';

// todo 2sub сделать меню ссылками
export async function chooseObject({
  userSubscription,
  groupsSubscriptions,
  telegramBot,
  user,
  db,
}: {
  userSubscription: SubscriptionWithTariffAndChat | undefined;
  groupsSubscriptions: SubscriptionWithTariffAndChat[];
  telegramBot: TelegramBotService;
  user: TelegramBot.User;
  db: DbService;
}): Promise<void> {
  const userChats = await db.getUserChats(user.id);
  const userChatsWithoutSubscriptions = _.differenceWith(
    userChats,
    groupsSubscriptions,
    (a, b) => a.id === b.chatId
  );
  const botName = await telegramBot.getUsername();

  let text = '';

  text += userSubscription
    ? `✏️ [Редактировать подписку](${getPrivateCommandUrl(
        botName,
        'subscription',
        makeObjectCallbackData(ObjectType.subscription, userSubscription.id)
      )}) ${getSubscriptionObjectText({
        subscription: userSubscription,
        grammarCase: 'acc',
        addition: 'tariffAndPrice',
        markdown: true,
        subscriptionTerm: false,
      })}`
    : `✚ [Оформить новую подписку](${getPrivateCommandUrl(
        botName,
        'subscription'
      )}) на \`себя\` \\(вы сможете делать краткие выжимки в любом чате, в котором есть Shorty\\)`;

  // fixme sub
  // const options = [
  //   userSubscription
  //     ? {
  //         description: `✏️ [Редактировать подписку](${getPrivateCommandUrl(
  //           botName,
  //           'subscription'
  //         )}) ${getSubscriptionObjectText({
  //           subscription: userSubscription,
  //           grammarCase: 'acc',
  //           addition: 'tariffAndPrice',
  //           markdown: true,
  //           subscriptionTerm: false,
  //         })}`,
  //         button: '✏️ Подписка на себя',
  //         callback_data: makeObjectCallbackData(ObjectType.subscription, userSubscription.id),
  //       }
  //     : {
  //         description:
  //           '✚ Оформить новую подписку на `себя`, тогда вы сможете делать краткие выжимки в любом чате \\(в котором есть Shorty\\)',
  //         button: '✚ Новая подписка на себя',
  //         callback_data: makeObjectCallbackData(ObjectType.user, user.id),
  //       },
  //   ...groupsSubscriptions
  //     .map((subscription) => ({
  //       description: `✏️ Редактировать ${getSubscriptionObjectText({
  //         subscription,
  //         grammarCase: 'acc',
  //         addition: 'tariffAndPrice',
  //         markdown: true,
  //       })}`,
  //       button: `✏️ ${ucFirst(
  //         getGroupTitle({
  //           chatId: required(subscription.chatId, 'chatId is required'),
  //           chat: subscription.chat,
  //         })
  //       )}`,
  //       callback_data: makeObjectCallbackData(ObjectType.subscription, subscription.id),
  //     }))
  //     .sort((a, b) => strCompare(a.button, b.button)),
  //   ...userChatsWithoutSubscriptions
  //     .map((chat) => ({
  //       description: `✚ Оформить новую подписку на ${getGroupTitle({
  //         chatId: chat.id,
  //         chat,
  //         grammarCase: 'acc',
  //         alwaysAddGroupTerm: true,
  //         markdown: true,
  //       })}`,
  //       button: `✚ ${ucFirst(getGroupTitle({ chatId: chat.id, chat }))}`,
  //       callback_data: makeObjectCallbackData(ObjectType.group, chat.id),
  //     }))
  //     .sort((a, b) => strCompare(a.button, b.button)),
  //   {
  //     description: '✚ Оформить подписку на другую группу',
  //     // '✚ Оформить новую подписку на `группу`, тогда любой участник этой группы сможет делать краткие выжимки',
  //     button: '✚ Подписка на другую группу',
  //     callback_data: makeObjectCallbackData(ObjectType.group),
  //   },
  // ];

  await telegramBot.sendMessage(user.id, text, { parse_mode: 'MarkdownV2' });
}
