import type TelegramBot from 'node-telegram-bot-api';
import { type CallbackQuery } from 'node-telegram-bot-api';
import { getEnv } from '../../config/envVars.ts';
import logger from '../../config/logger.ts';
import { escapeTelegramMarkdown as esc } from '../../data/telegramBotMessageUtils.ts';
import type DbService from '../../services/DbService.ts';
import type TelegramBotService from '../../services/TelegramBotService.ts';
import { type UKassaPaymentWebhook } from '../../services/UKassaService/UKassaPaymentWebhook.ts';
import { ukassaService } from '../../services/UKassaService/UKassaService.ts';
import type ChatController from '../ChatController.ts';
import { required } from '../../lib/lang.ts';
import { PaymentProvider } from '@prisma/client';
import { addMonths } from 'date-fns';

const tariffCallbackKey = 'subscribe_tariff';
const makeTariffCallbackData = (tariffId: string): string => `${tariffCallbackKey}/${tariffId}`;
const parseTariffCallbackData = (data: string): { tariffId: string } => ({
  tariffId: required(data.split('/')[1], 'tariffId is required in callback data'),
});

const objectCallbackKey = 'subscribe_object';
const makeObjectCallbackData = (
  object: 'user' | 'group',
  tariffId: string,
  subscriptionId: bigint
): string => `${objectCallbackKey}/${object}/${tariffId}/${subscriptionId}`;
const parseObjectCallbackData = (
  data: string
): { object: 'user' | 'group'; tariffId: string; subscriptionId: bigint } => ({
  object: required(data.split('/')[1] as 'user' | 'group', 'object is required in callback data'),
  tariffId: required(data.split('/')[2], 'tariffId is required in callback data'),
  subscriptionId: BigInt(
    required(data.split('/')[3], 'subscriptionId is required in callback data')
  ),
});

const emojiNumbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

// todo CLUTCH
let subscribed = false;

// todo списание денег раз в месяц
// todo /subscriptions command
// todo unsubscribe command
// todo change tariff
// todo change group
// todo check already subscribed
// todo ukassa link loader
// todo detect referring group
// todo check subscriptions
// todo subscriptions periods
// todo команда "обратиться в поддержку"
// todo buttons emojies
// todo fix /tariff command
// todo возможность активировать подписку позднее
// todo notifications about subscription end
const subscribeCommandController: ChatController = ({
  chat$,
  chatId,
  services: { db, telegramBot },
}) => {
  chat$.subscribe(async () => {
    try {
      const tariffs = await db.getAllTariffs();

      const text = `**⭐ Выберите подписку:**\n
${tariffs
  .map(
    (tariff, index) =>
      `**${emojiNumbers[index]} ${esc(tariff.name)} \\(${formatPrice(tariff.price)} / мес\\)**${
        Boolean(tariff.description) ? `\n_${esc(tariff.description)}_` : ''
      }`
  )
  .join('\n\n')}`;

      await telegramBot.sendMessage(chatId, text, {
        parse_mode: 'MarkdownV2',
        reply_markup: {
          inline_keyboard: tariffs.map((tariff, index) => [
            {
              text: `${emojiNumbers[index]} ${tariff.name} (${formatPrice(tariff.price)} / мес)`,
              callback_data: makeTariffCallbackData(tariff.id),
            },
          ]),
        },
      });
    } catch (error) {
      logger.error('Error in subscribeCommandController', error);
    }
  });

  if (!subscribed) {
    subscribed = true;
    telegramBot.onCallbackQuery((query) => tgButtonCallback(query, db, telegramBot));
    ukassaService.onPaymentSucceeded((webhook) => paymentSucceeded(webhook, db, telegramBot));
  }
};

export default subscribeCommandController;

function formatPrice(price: number): string {
  return `${Math.floor(price / 100)}₽`;
}

async function tgButtonCallback(
  query: CallbackQuery,
  db: DbService,
  telegramBot: TelegramBotService
): Promise<void> {
  try {
    if (query.data == null) return;

    const key = query.data.split('/')[0];

    // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
    switch (key) {
      case tariffCallbackKey: {
        await subscribeTariffCallback({
          ...parseTariffCallbackData(query.data),
          db,
          telegramBot,
          user: query.from,
        });
        break;
      }
      case objectCallbackKey: {
        await subscribeObjectCallback({
          ...parseObjectCallbackData(query.data),
          db,
          telegramBot,
          user: query.from,
        });
        break;
      }
    }
  } catch (error) {
    logger.error('Error in subscribeCommandController', error);
  }
}

async function subscribeTariffCallback({
  tariffId,
  db,
  telegramBot,
  user,
}: {
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

  // todo remove loading
  await telegramBot.sendMessage(user.id, '⏳ Подождите…');

  const botName = await telegramBot.getUsername();
  const paymentUrl = await ukassaService.createPayment({
    price: tariff.price,
    description: `Подписка на тариф "${tariff.name}"`,
    returnUrl: `https://t.me/${botName}`,
    metadata: {
      tariffId,
      userId: user.id,
      username: user.username,
      secret: getEnv().UKASSA_WEBHOOK_SECRET_KEY,
    } satisfies UKassaPaymentWebhook['object']['metadata'],
  });

  await telegramBot.sendMessage(
    user.id,
    '❗ Пожалуйста, отметьте опцию `Разрешаю автосписания` \\(`I allow debiting money automatically`\\) если не хотите вручную продлевать подписку каждый месяц\\. В этом случае подписка будет продлеваться автоматически\\.\n\n⭐ Ссылка на оплату 👇',
    {
      parse_mode: 'MarkdownV2',
      reply_markup: {
        inline_keyboard: [[{ text: 'Оплатить через сервис ЮKassa', url: paymentUrl }]],
      },
    }
  );
}

async function paymentSucceeded(
  webhook: UKassaPaymentWebhook,
  db: DbService,
  telegramBot: TelegramBotService
): Promise<void> {
  const metadata = webhook.object.metadata;
  const { tariffId, userId, username } = metadata;

  const { id } = await db.addSubscription({
    autoRenew: webhook.object.payment_method.saved,
    paymentMethodId: webhook.object.payment_method.id,
    renewPeriodMonths: 1,
    paymentProvider: PaymentProvider.YooKassa,
    expires: addMonths(new Date(), 1),
    tariffId,
    subscriber: {
      id: userId,
      username,
    },
  });

  // todo fix appearance
  await telegramBot.sendMessage(
    userId,
    `💸 Оплата прошла успешно!

❓ Теперь выберите: вы хотите активировать премиум на себя или на групповой чат?

Если на себя: то вы сможете делать краткие выжимки в любом чате (в котором есть Shorty).
Если на групповой чат: то любой участник этого чата сможет делать краткие выжимки.`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'На себя',
              callback_data: makeObjectCallbackData('user', tariffId, id),
            },
            {
              text: 'На групповой чат',
              callback_data: makeObjectCallbackData('group', tariffId, id),
            },
          ],
        ],
      },
    }
  );
}

async function subscribeObjectCallback({
  object,
  tariffId,
  subscriptionId,
  db,
  telegramBot,
  user,
}: {
  object: 'user' | 'group';
  tariffId: string;
  subscriptionId: bigint;
  db: DbService;
  telegramBot: TelegramBotService;
  user: TelegramBot.User;
}): Promise<void> {
  if (object === 'user') {
    await db.updateSubscription(subscriptionId, { userId: BigInt(user.id) });
    await telegramBot.sendMessage(user.id, '✅ Подписка активирована!'); // todo instructions
  } else {
    const key = await db.createActivationKey(tariffId, user.id, subscriptionId);
    const botName = await telegramBot.getUsername();
    await telegramBot.sendMessage(
      user.id,
      `Для того чтобы активировать подписку на групповой чат, добавьте меня в него \\(если ещё этого не сделали\\) и напишите в нём это сообщение:
\`/activate@${botName} ${key.id}\`\n\n
_\\(Просто кликните на сообщение, и оно будет скопировано в буфер обмена\\)_`,
      { parse_mode: 'MarkdownV2' }
    ); // todo ссылка (как добавить в группу)
  }
}
