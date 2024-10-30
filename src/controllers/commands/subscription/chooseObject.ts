import { type Chat } from '@prisma/client';
import _ from 'lodash';
import type TelegramBot from 'node-telegram-bot-api';
import { getGroupTitle } from '../../../data/dbChatUtils';
import { getSubscriptionObjectText } from '../../../data/subscriptionUtils';
import { getTariffText } from '../../../data/tariffUtils';
import { escapeTelegramMarkdown } from '../../../data/telegramBotMessageUtils';
import { required } from '../../../lib/common/lang';
import { strCompare } from '../../../lib/common/string';
import type DbService from '../../../services/DbService';
import { type SubscriptionWithTariffAndChat } from '../../../services/DbService';
import type TelegramBotService from '../../../services/TelegramBotService';
import { chooseTariff } from './chooseTariff';
import { checkAccessToObject } from './common';
import { makeObjectUrl } from './routing';
import { ObjectType } from './types/ObjectType';

export async function subscribeToGroup({
  telegramBot,
  user,
  id,
  db,
}: {
  telegramBot: TelegramBotService;
  user: TelegramBot.User;
  id: bigint;
  db: DbService;
}): Promise<void> {
  await checkAccessToObject({ db, user, object: ObjectType.group, id });
  const subscription = await db.getUserSubscription(user.id, Number(id));

  if (subscription) {
    await chooseTariff({
      telegramBot,
      db,
      user,
      object: ObjectType.subscription,
      id: subscription.id,
    });
  } else {
    const userSubscription = await db.getUserSubscription(user.id);
    const chat = await db.getChat(Number(id));
    await chooseObject({
      userSubscription: userSubscription ?? undefined,
      groupsSubscriptions: [],
      telegramBot,
      user,
      db,
      userChats: [required(chat, 'chat is required')],
      disableNewGroup: true,
    });
  }
}

export async function chooseObject({
  userSubscription,
  groupsSubscriptions,
  telegramBot,
  user,
  db,
  userChats: userChats_,
  disableNewGroup,
}: {
  userSubscription: SubscriptionWithTariffAndChat | undefined;
  groupsSubscriptions: SubscriptionWithTariffAndChat[];
  telegramBot: TelegramBotService;
  user: TelegramBot.User;
  db: DbService;
  userChats?: Chat[];
  disableNewGroup?: boolean;
}): Promise<void> {
  const userChats = userChats_ ?? (await db.getUserChats(user.id));

  const userChatsWithoutSubscriptions = _.differenceWith(
    userChats,
    groupsSubscriptions,
    (a, b) => a.id === b.chatId
  );
  const botName = await telegramBot.getUsername();

  const rows = [
    userSubscription
      ? `👤✏️ [Редактировать индивидуальную подписку](${makeObjectUrl({
          botName,
          object: ObjectType.subscription,
          id: userSubscription.id,
        })}) \\(${escapeTelegramMarkdown(
          getTariffText({ tariff: userSubscription.tariff, format: 'nameAndPrice' })
        )}\\)`
      : `👤 ✚ [Оформить индивидуальную подписку](${makeObjectUrl({
          botName,
          object: ObjectType.user,
          id: user.id,
        })})`,

    ...groupsSubscriptions
      .map(
        (subscription) =>
          `👥✏️ [Редактировать подписку](${makeObjectUrl({
            botName,
            object: ObjectType.subscription,
            id: subscription.id,
          })}) на ${getSubscriptionObjectText({
            subscription,
            grammarCase: 'acc',
            tariffText: 'nameAndPrice',
            markdown: true,
            subscriptionTerm: false,
          })}`
      )
      .sort((a, b) => strCompare(a, b)),
    ...userChatsWithoutSubscriptions
      .slice(0, 10)
      .map(
        (chat) =>
          `👥 ✚ [Оформить новую подписку](${makeObjectUrl({
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

    disableNewGroup
      ? undefined
      : `👥 ✚ [Оформить новую подписку](${makeObjectUrl({
          botName,
          object: ObjectType.group,
        })}) на другую группу`,
  ];

  await telegramBot.sendMessage(
    user.id,
    `⭐️ Здесь вы можете оформить новую или отредактировать существующую подписку

👤 Индивидуальная подписка даёт вам возможность делать краткие выжимки в любом чате \\(в котором есть Shorty\\)
👥 Подписка на \`групповой чат\` даёт возможность любому участнику этого чата делать в нём краткие выжимки\n\n` +
      rows.filter(Boolean).join('\n\n'),
    { parse_mode: 'MarkdownV2' }
  );
}
