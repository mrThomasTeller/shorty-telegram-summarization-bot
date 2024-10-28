import _ from 'lodash';
import type TelegramBot from 'node-telegram-bot-api';
import { getGroupTitle } from '../../../data/dbChatUtils';
import { getSubscriptionObjectText } from '../../../data/subscriptionUtils';
import { strCompare } from '../../../lib/common/string';
import type DbService from '../../../services/DbService';
import { type SubscriptionWithTariffAndChat } from '../../../services/DbService';
import type TelegramBotService from '../../../services/TelegramBotService';
import { makeObjectUrl } from './routing';
import { ObjectType } from './types/ObjectType';

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

  const rows = [
    userSubscription
      ? `✏️ [Редактировать подписку](${makeObjectUrl({
          botName,
          object: ObjectType.subscription,
          id: userSubscription.id,
        })}) на ${getSubscriptionObjectText({
          subscription: userSubscription,
          grammarCase: 'acc',
          addition: 'tariffAndPrice',
          markdown: true,
          subscriptionTerm: false,
        })}`
      : `✚ [Оформить новую подписку](${makeObjectUrl({
          botName,
          object: ObjectType.user,
        })}) на \`себя\` \\(вы сможете делать краткие выжимки в любом чате, в котором есть Shorty\\)`,

    ...groupsSubscriptions
      .map(
        (subscription) =>
          `✏️ [Редактировать подписку](${makeObjectUrl({
            botName,
            object: ObjectType.subscription,
            id: subscription.id,
          })}) на ${getSubscriptionObjectText({
            subscription,
            grammarCase: 'acc',
            addition: 'tariffAndPrice',
            markdown: true,
            subscriptionTerm: false,
          })}`
      )
      .sort((a, b) => strCompare(a, b)),
    ...userChatsWithoutSubscriptions
      .slice(0, 10)
      .map(
        (chat) =>
          `✚ [Оформить новую подписку](${makeObjectUrl({
            botName,
            object: ObjectType.group,
            id: chat.id,
          })}) на ${getGroupTitle({
            chatId: chat.id,
            chat,
            grammarCase: 'acc',
            alwaysAddGroupTerm: true,
            markdown: true,
          })}`
      )
      .sort((a, b) => strCompare(a, b)),
    `✚ [Оформить новую подписку](${makeObjectUrl({
      botName,
      object: ObjectType.group,
    })}) на другую группу`,
  ];

  await telegramBot.sendMessage(
    user.id,
    `👉 Если оформите подписку на \`себя\` сможете делать краткие выжимки в любом чате \\(в котором есть Shorty\\)
👉 Если оформите подписку на \`групповой чат\`, любой участник этого чата сможет делать краткие выжимки\n\n` +
      rows.join('\n\n'),
    { parse_mode: 'MarkdownV2' }
  );
}
