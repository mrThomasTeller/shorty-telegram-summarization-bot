import type TelegramBot from 'node-telegram-bot-api';
import { getEnv } from '../../../config/envVars';
import logger from '../../../config/logger';
import { getTariffText } from '../../../data/tariffUtils';
import {
  escapeTelegramMarkdown as esc,
  escapeTelegramMarkdown,
} from '../../../data/telegramBotMessageUtils';
import type DbService from '../../../services/DbService';
import type TelegramBotService from '../../../services/TelegramBotService';
import { ukassaService } from '../../../services/UKassaService/UKassaService';
import { makeTariffUrl } from './routing';
import { ObjectType } from './types/ObjectType';
import { type UkassaWebhookMetadata } from './types/UkassaWebhookMetadata';
import { checkAccessToObject } from './common';
import { getSubscriptionObjectText } from '../../../data/subscriptionUtils';
import { ucFirst } from '../../../lib/common/string';
import { helpKeyboard, helpKeyboardButton } from './help';
import { required } from '../../../lib/common/lang';

export async function chooseTariff({
  object,
  id,
  db,
  telegramBot,
  user,
}: {
  object: ObjectType;
  id: bigint;
  db: DbService;
  telegramBot: TelegramBotService;
  user: TelegramBot.User;
}): Promise<void> {
  await checkAccessToObject({ db, telegramBot, user, object, id });

  const tariffs = await db.getAllTariffs();
  const botName = await telegramBot.getUsername();
  const subscription = object === ObjectType.subscription ? await db.getSubscription(id) : null;

  const objectEmoji = object === ObjectType.group || subscription?.chatId != null ? '👥' : '👤';
  const objectText = getSubscriptionObjectText({
    subscription: subscription ?? {
      userId: object === ObjectType.subscription ? BigInt(user.id) : null,
      chatId: object === ObjectType.group ? id : null,
      chat: object === ObjectType.group ? await db.getChat(Number(id)) : null,
    },
  });

  const text = `${objectEmoji} ${escapeTelegramMarkdown(
    subscription ? ucFirst(objectText) : 'Новая ' + objectText
  )}

**⭐ Выберите ${subscription ? 'новый ' : ''}тариф:**

${tariffs
  .map((tariff) => {
    const tariffLinkText = `💼 ${esc(
      getTariffText({
        tariff,
        format: 'nameAndPrice',
        separator: ' (',
      })
    )}\\)`;
    const tariffUrl = makeTariffUrl({
      botName,
      object,
      id,
      tariffId: tariff.id,
    });
    const description = Boolean(tariff.description) ? '\n_' + esc(tariff.description) + '_' : '';

    return `[${tariffLinkText}](${tariffUrl})${description}`;
  })
  .join('\n\n')}`;

  await telegramBot.sendMessage(user.id, text, {
    parse_mode: 'MarkdownV2',
    ...helpKeyboard(botName),
  });
}

// todo если здесь появится промежуточный шаг нужно проверить все места, которые сюда ведут
export async function tariffChosen({
  object,
  id,
  tariffId,
  db,
  telegramBot,
  user,
}: {
  object: ObjectType;
  id: bigint;
  tariffId: string;
  db: DbService;
  telegramBot: TelegramBotService;
  user: TelegramBot.User;
}): Promise<void> {
  const tariffs = await db.getAllTariffs();
  const tariff = tariffs.find((t) => t.id === tariffId);

  if (!tariff) {
    logger.warn(`Tariff with id ${tariffId} not found`);
    return;
  }

  // todo 2sub remove loading
  await telegramBot.sendMessage(user.id, '⏳ Подождите…');

  await checkAccessToObject({ db, telegramBot, user, object, id });

  const botName = await telegramBot.getUsername();
  const createPayment = (savePaymentMethod: boolean): Promise<string | undefined> =>
    ukassaService.createPayment<UkassaWebhookMetadata>({
      price: savePaymentMethod ? tariff.discountedPrice : tariff.price,
      description: `Shorty: подписка на тариф "${tariff.name}". Период оплаты: 1 месяц.`,
      returnUrl: `https://t.me/${botName}`,
      savePaymentMethod,
      metadata: {
        object,
        id: Number(id),
        tariffId,
        userId: user.id,
        username: user.username,
        secret: getEnv().UKASSA_WEBHOOK_SECRET_KEY,
      },
    });

  const [subscriptionPaymentUrl, oneTimePaymentUrl] = await Promise.all([
    createPayment(true),
    createPayment(false),
  ]);

  await telegramBot.sendMessage(
    user.id,
    `
_Оплата происходит через сервис [ЮKassa](https://yookassa.ru/)

⭐️ Вы можете оформить ежемесячную подписку, тогда необходимая сумма будет списываться автоматически каждый месяц\\. Вы сможете отключить автосписание в любой момент введя здесь команду /subscription, при этом подписка будет действовать до конца оплаченного периода\\.

1️⃣ Также вы можете оплатить только один месяц без автопродления\\._

👇 Ссылки на оплату 👇`.trim(),
    {
      parse_mode: 'MarkdownV2',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: `⭐️ Ежемесячная подписка (${getTariffText({ tariff })})`,
              url: required(subscriptionPaymentUrl, 'Subscription payment url is required'),
            },
          ],
          [
            {
              text: `1️⃣ Один месяц (${getTariffText({ tariff })})`,
              url: required(oneTimePaymentUrl, 'One time payment url is required'),
            },
          ],
          helpKeyboardButton(botName),
        ],
      },
    }
  );
}
