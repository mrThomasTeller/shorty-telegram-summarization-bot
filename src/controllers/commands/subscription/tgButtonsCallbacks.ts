import { type CallbackQuery } from 'node-telegram-bot-api';
import logger from '../../../config/logger.ts';
import { required } from '../../../lib/common/lang.ts';
import type DbService from '../../../services/DbService.ts';
import type TelegramBotService from '../../../services/TelegramBotService.ts';
import { chooseTariff, tariffChosen } from './chooseTariff.ts';
import { doEditSubscription, editSubscription } from './editSubscription.ts';
import { type EditSubscriptionAction } from './types/EditSubscriptionAction.ts';
import { ObjectType } from './types/ObjectType.ts';
import { subscribeFromGroupInstructions } from './common.ts';

let key = 0;

const objectCallbackKey = `subscription_${++key}`;
export const makeObjectCallbackData = (object: ObjectType, id?: number | bigint): string =>
  `${objectCallbackKey}/${object}/${id ?? 0}`;
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const parseObjectCallbackData = (data: string) => ({
  object: required(data.split('/')[1] as ObjectType, 'object is required in callback data'),
  id: BigInt(required(data.split('/')[2], 'id is required in callback data')) || undefined,
});

const tariffCallbackKey = `subscription_${++key}`;
export const makeTariffCallbackData = (
  object: ObjectType,
  id: number | bigint,
  tariffId: string
): string => `${tariffCallbackKey}/${object}/${id}/${tariffId}`;
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const parseTariffCallbackData = (data: string) => ({
  object: required(data.split('/')[1] as ObjectType, 'object is required in callback data'),
  id: BigInt(required(data.split('/')[2], 'id is required in callback data')),
  tariffId: required(data.split('/')[3], 'tariffId is required in callback data'),
});

const editSubscriptionCallbackKey = `subscription_${++key}`;
export const makeEditSubscriptionCallbackData = (
  subscriptionId: bigint,
  action: EditSubscriptionAction,
  groupId?: bigint
): string => `${editSubscriptionCallbackKey}/${subscriptionId}/${action}/${groupId ?? 0}`;
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const parseEditSubscriptionCallbackData = (data: string) => ({
  subscriptionId: BigInt(
    required(data.split('/')[1], 'subscriptionId is required in callback data')
  ),
  action: required(
    data.split('/')[2] as EditSubscriptionAction,
    'action is required in callback data'
  ),
  groupId:
    BigInt(required(data.split('/')[3], 'groupId is required in callback data')) || undefined,
});

export async function tgButtonCallback(
  query: CallbackQuery,
  db: DbService,
  telegramBot: TelegramBotService
): Promise<void> {
  try {
    if (query.data == null) return;

    const key = query.data.split('/')[0];

    // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
    switch (key) {
      case objectCallbackKey: {
        const params = {
          ...parseObjectCallbackData(query.data),
          db,
          telegramBot,
          user: query.from,
        };

        if (params.object === ObjectType.subscription) {
          await editSubscription({
            ...params,
            id: required(params.id, 'subscription id is required'),
          });
        } else if (params.object === ObjectType.group && params.id == null) {
          await subscribeFromGroupInstructions(telegramBot, query.from.id, 'subscribe');
        } else {
          await chooseTariff({
            ...params,
            id: required(params.id, 'object id is required'),
          });
        }
        break;
      }

      case tariffCallbackKey: {
        await tariffChosen({
          ...parseTariffCallbackData(query.data),
          db,
          telegramBot,
          user: query.from,
        });
        break;
      }

      case editSubscriptionCallbackKey: {
        await doEditSubscription({
          ...parseEditSubscriptionCallbackData(query.data),
          db,
          telegramBot,
          user: query.from,
        });
        break;
      }
    }
  } catch (error) {
    logger.error('Error in subscriptionCommandController', error);
  }
}
