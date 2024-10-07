import type TelegramBot from 'node-telegram-bot-api';
import { getEnv } from '../../../config/envVars.ts';
import logger from '../../../config/logger.ts';
import { escapeTelegramMarkdown as esc } from '../../../data/telegramBotMessageUtils.ts';
import type DbService from '../../../services/DbService.ts';
import type TelegramBotService from '../../../services/TelegramBotService.ts';
import { ukassaService } from '../../../services/UKassaService/UKassaService.ts';
import { makeTariffCallbackData } from './tgButtonsCallbacks.ts';
import { type ObjectType } from './types/ObjectType.ts';
import { type UkassaWebhookMetadata } from './types/UkassaWebhookMetadata.ts';

const emojiNumbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

function formatPrice(price: number): string {
  return `${Math.floor(price / 100)}₽`;
}

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
  const tariffs = await db.getAllTariffs();

  const text = `**⭐ Выберите тариф:**\n
    ${tariffs
      .map(
        (tariff, index) =>
          `**${emojiNumbers[index]} ${esc(tariff.name)} \\(${formatPrice(
            tariff.price
            // eslint-disable-next-line sonarjs/no-nested-template-literals
          )} / мес\\)**${Boolean(tariff.description) ? `\n_${esc(tariff.description)}_` : ''}`
      )
      .join('\n\n')}`;

  await telegramBot.sendMessage(user.id, text, {
    parse_mode: 'MarkdownV2',
    reply_markup: {
      inline_keyboard: tariffs.map((tariff, index) => [
        {
          text: `${emojiNumbers[index]} ${tariff.name} (${formatPrice(tariff.price)} / мес)`,
          callback_data: makeTariffCallbackData(object, id, tariff.id),
        },
      ]),
    },
  });
}

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

  const botName = await telegramBot.getUsername();
  const paymentUrl = await ukassaService.createPayment<UkassaWebhookMetadata>({
    price: tariff.price,
    description: `Shorty: подписка на тариф "${tariff.name}". Период оплаты: 1 месяц.`,
    returnUrl: `https://t.me/${botName}`,
    metadata: {
      object,
      id,
      tariffId,
      userId: user.id,
      username: user.username,
      secret: getEnv().UKASSA_WEBHOOK_SECRET_KEY,
    },
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
