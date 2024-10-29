import { PaymentProvider } from '@prisma/client';
import { addDays } from 'date-fns';
import { setTimeout } from 'node:timers/promises';
import config from '../../config/config';
import { getEnv } from '../../config/envVars';
import logger from '../../config/logger';
import {
  makeEditSubscriptionUrl,
  makeTariffUrl,
} from '../../controllers/commands/subscription/routing';
import { EditSubscriptionAction } from '../../controllers/commands/subscription/types/EditSubscriptionAction';
import { ObjectType } from '../../controllers/commands/subscription/types/ObjectType';
import { type UkassaWebhookMetadata } from '../../controllers/commands/subscription/types/UkassaWebhookMetadata';
import { getSubscriptionObjectText } from '../../data/subscriptionUtils';
import { required } from '../../lib/common/lang';
import type DbService from '../../services/DbService';
import { type SubscriptionWithTariffAndChat } from '../../services/DbService';
import type TelegramBotService from '../../services/TelegramBotService';
import {
  UKassaPaymentCanceledError,
  ukassaService,
} from '../../services/UKassaService/UKassaService';
import type EntryPoint from '../EntryPoint';

export const subscriptionsChecker: EntryPoint = async ({ db, telegramBot }) => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  while (true) {
    try {
      await checkSubscriptions({ db, telegramBot });
    } catch (error) {
      logger.error('subscriptionsChecker error', error);
    }
    await setTimeout(config.subscriptions.checkInterval);
  }
};

// todo 2sub не присылать уведомления ночью (expires ставить на утро?)
// для тестирования неуспешного автопродления карта 5555555555554642
async function checkSubscriptions({
  db,
  telegramBot,
}: {
  db: DbService;
  telegramBot: TelegramBotService;
}): Promise<void> {
  const subscriptions = await db.getAllSubscriptions();
  const tariffs = await db.getAllTariffs();
  const botName = await telegramBot.getUsername();

  for (const subscription of subscriptions) {
    if (
      subscription.paymentProvider === PaymentProvider.YooKassa &&
      subscription.expires < new Date() &&
      !subscription.disableSubscriptionCheck
    ) {
      if (subscription.autoRenew) {
        // renew
        try {
          const tariff = required(
            tariffs.find((t) => t.id === subscription.tariffId),
            'Tariff not found'
          );

          await ukassaService.createPayment<UkassaWebhookMetadata>({
            description: `Автоматическое списание платежа за подписку на Shorty. Тариф: ${tariff.name}. Период оплаты: 1 месяц.`,
            metadata: {
              secret: getEnv().UKASSA_WEBHOOK_SECRET_KEY,
              tariffId: tariff.id,
              userId: Number(subscription.subscriberUserId),
              username: subscription.subscriberUserName ?? undefined,
              object: ObjectType.subscription,
              id: Number(subscription.id),
              autoRenew: true,
            },
            price: tariff.price,
            paymentMethodId: subscription.paymentMethodId ?? undefined,
          });
        } catch (error) {
          if (!(error instanceof UKassaPaymentCanceledError)) {
            throw error;
          }

          const triesToRenew = subscription.triesToRenew + 1;
          if (triesToRenew >= config.subscriptions.maxTriesToRenew) {
            await db.updateSubscription(subscription.id, {
              disableSubscriptionCheck: true,
              triesToRenew: 0,
            });

            await telegramBot.sendMessage(
              Number(subscription.subscriberUserId),
              `⚠️ ${getEndSubscriptionText(
                subscription
              )} Не получилось автоматически продлить подписку.`,
              {
                reply_markup: {
                  inline_keyboard: [
                    [
                      {
                        text: '⭐️ Продлить вручную',
                        url: makeTariffUrl({
                          botName,
                          object: ObjectType.subscription,
                          id: subscription.id,
                          tariffId: subscription.tariffId,
                        }),
                      },
                    ],
                  ],
                },
              }
            );
          } else {
            await db.updateSubscription(subscription.id, {
              triesToRenew,
              deactivated: true,
              expires: addDays(new Date(), 1),
            });

            await telegramBot.sendMessage(
              Number(subscription.subscriberUserId),
              `⚠️ ${getEndSubscriptionText(
                subscription
              )} Не получилось автоматически продлить подписку.

⏰ Попробую ещё раз завтра.`,
              {
                reply_markup: {
                  inline_keyboard: [
                    [
                      {
                        text: '⭐️ Продлить вручную',
                        url: makeTariffUrl({
                          botName,
                          object: ObjectType.subscription,
                          id: subscription.id,
                          tariffId: subscription.tariffId,
                        }),
                      },
                    ],
                    [
                      {
                        text: '🚫 Отключить автопродление',
                        url: makeEditSubscriptionUrl({
                          botName,
                          subscriptionId: subscription.id,
                          action: EditSubscriptionAction.unsubscribe,
                        }),
                      },
                    ],
                  ],
                },
              }
            );
          }
        }
      } else {
        await telegramBot.sendMessage(
          Number(subscription.subscriberUserId),
          `⚠️ ${getEndSubscriptionText(subscription)}`,
          {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: '⭐️ Продлить подписку',
                    url: makeTariffUrl({
                      botName,
                      object: ObjectType.subscription,
                      id: subscription.id,
                      tariffId: subscription.tariffId,
                    }),
                  },
                ],
              ],
            },
          }
        );

        await db.updateSubscription(subscription.id, {
          disableSubscriptionCheck: true,
        });
      }
    }
  }
}

const getEndSubscriptionText = (subscription: SubscriptionWithTariffAndChat): string =>
  `Ваша ${getSubscriptionObjectText({ subscription })} закончилась.`;
