import type TelegramBot from 'node-telegram-bot-api';
import { getEnv } from '../../../config/envVars';
import logger from '../../../config/logger';
import { getTariffPriceText } from '../../../data/tariffUtils';
import { escapeTelegramMarkdown as esc } from '../../../data/telegramBotMessageUtils';
import type DbService from '../../../services/DbService';
import type TelegramBotService from '../../../services/TelegramBotService';
import { ukassaService } from '../../../services/UKassaService/UKassaService';
import { makeTariffUrl } from './routing';
import { type ObjectType } from './types/ObjectType';
import { type UkassaWebhookMetadata } from './types/UkassaWebhookMetadata';
import { checkAccessToObject } from './common';

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
  const botName = await telegramBot.getUsername();

  const text = `**⭐ Выберите тариф:**

${tariffs
  .map((tariff) => {
    const tariffLinkText = `💼 ${esc(tariff.name)} \\(${getTariffPriceText(tariff)}\\)`;
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

  await telegramBot.sendMessage(user.id, text, { parse_mode: 'MarkdownV2' });
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

  await checkAccessToObject({ db, user, object, id });

  const botName = await telegramBot.getUsername();
  const paymentUrl = await ukassaService.createPayment<UkassaWebhookMetadata>({
    price: tariff.price,
    description: `Shorty: подписка на тариф "${tariff.name}". Период оплаты: 1 месяц.`,
    returnUrl: `https://t.me/${botName}`,
    metadata: {
      object,
      id: Number(id),
      tariffId,
      userId: user.id,
      username: user.username,
      secret: getEnv().UKASSA_WEBHOOK_SECRET_KEY,
    },
  });

  await telegramBot.sendMessage(
    user.id,
    '❗ Пожалуйста, отметьте опцию `☑️ Разрешаю автосписания` \\(`I allow debiting money automatically`\\) если не хотите вручную продлевать подписку каждый месяц\\. В этом случае подписка будет продлеваться автоматически\\.\n\n⭐ Ссылка на оплату 👇',
    {
      parse_mode: 'MarkdownV2',
      reply_markup: {
        inline_keyboard: [[{ text: 'Оплатить через сервис ЮKassa', url: paymentUrl }]],
      },
    }
  );
}
