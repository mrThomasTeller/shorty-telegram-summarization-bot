import { CallbackQuery } from 'node-telegram-bot-api';
import logger from '../../config/logger.ts';
import { escapeTelegramMarkdown as esc } from '../../data/telegramBotMessageUtils.ts';
import { ukassaService } from '../../services/UKassaService/UKassaService.ts';
import type ChatController from '../ChatController.ts';
import DbService from '../../services/DbService.ts';
import TelegramBotService from '../../services/TelegramBotService.ts';
import { UKassaPaymentWebhook } from '../../services/UKassaService/UKassaPaymentWebhook.ts';

const emojiNumbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

// todo CLUTCH
let subscribed = false;

type Metadata = {
  tariffId: string;
  userId: number;
};

// todo change tariff
// todo change group
// todo check already subscribed
// todo ukassa link loader
const subscribeCommandController: ChatController = ({
  chat$,
  chatId,
  services: { db, telegramBot },
}) => {
  chat$.subscribe(async (msg) => {
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
              callback_data: `subscribe:${tariff.id}`,
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
    ukassaService.onPaymentSucceeded((webhook) => paymentSucceeded(webhook, telegramBot));
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
    if (query.data?.startsWith('subscribe:') === true) {
      const tariffId = query.data.split(':')[1];
      const tariffs = await db.getAllTariffs();
      const tariff = tariffs.find((t) => t.id === tariffId);

      if (!tariff || tariffId == null) {
        logger.warn(`Tariff with id ${tariffId} not found`);
        return;
      }

      const botName = await telegramBot.getUsername();
      const paymentUrl = await ukassaService.createPayment({
        price: tariff.price,
        description: `Подписка на тариф "${tariff.name}"`,
        returnUrl: `https://t.me/${botName}`,
        metadata: {
          tariffId,
          userId: query.from.id,
        } satisfies Metadata,
      });
      await telegramBot.sendMessage(query.from.id, '⭐ Ссылка на оплату 👇', {
        reply_markup: {
          inline_keyboard: [[{ text: 'Оплатить через сервис ЮKassa', url: paymentUrl }]],
        },
      });
    }
  } catch (error) {
    logger.error('Error in subscribeCommandController', error);
  }
}

async function paymentSucceeded(
  webhook: UKassaPaymentWebhook,
  telegramBot: TelegramBotService
): Promise<void> {
  const metadata = webhook.object.metadata as Metadata;
  const { tariffId, userId } = metadata;

  await telegramBot.sendMessage(userId, '💸 Оплата прошла успешно!');
  // группа, чат?
}
