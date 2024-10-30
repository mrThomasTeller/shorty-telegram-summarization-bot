import type TelegramBot from 'node-telegram-bot-api';
import { getCommandParameter, getPrivateCommandUrl } from '../../../data/telegramBotMessageUtils';
import { required } from '../../../lib/common/lang';
import type DbService from '../../../services/DbService';
import type TelegramBotService from '../../../services/TelegramBotService';
import { chooseTariff, tariffChosen } from './chooseTariff';
import { subscribeFromGroupInstructions } from './common';
import { doEditSubscription, editSubscription } from './editSubscription';
import { type EditSubscriptionAction } from './types/EditSubscriptionAction';
import { ObjectType } from './types/ObjectType';
import { subscribeToGroup } from './chooseObject';
import { help } from './help';

// todo 2sub переделать роутинг

const groupKey = 'group';
export const makeGroupUrl = ({ botName, id }: { botName: string; id: bigint }): string =>
  getPrivateCommandUrl(botName, 'subscription', `${groupKey}=${id}`);
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const parseGroupParams = (data: string) => ({
  id: BigInt(required(data.split(' ')[1], 'id is required in callback data')),
});

const objectKey = 'object';
export const makeObjectUrl = ({
  botName,
  object,
  id,
}: {
  botName: string;
  object: ObjectType;
  id?: number | bigint;
}): string => getPrivateCommandUrl(botName, 'subscription', `${objectKey}=${object}=${id ?? 0}`);
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const parseObjectParams = (data: string) => ({
  object: required(data.split(' ')[1] as ObjectType, 'object is required in callback data'),
  id: BigInt(required(data.split(' ')[2], 'id is required in callback data')) || undefined,
});

const tariffKey = 'tariff';
export const makeTariffUrl = ({
  botName,
  object,
  id,
  tariffId,
}: {
  botName: string;
  object: ObjectType;
  id: number | bigint;
  tariffId: string;
}): string =>
  getPrivateCommandUrl(botName, 'subscription', `${tariffKey}=${object}=${id}=${tariffId}`);
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const parseTariffParams = (data: string) => ({
  object: required(data.split(' ')[1] as ObjectType, 'object is required in callback data'),
  id: BigInt(required(data.split(' ')[2], 'id is required in callback data')),
  tariffId: required(data.split(' ')[3], 'tariffId is required in callback data'),
});

const editSubscriptionKey = 'edit';
export const makeEditSubscriptionUrl = ({
  botName,
  subscriptionId,
  action,
  groupId,
}: {
  botName: string;
  subscriptionId: bigint;
  action: EditSubscriptionAction;
  groupId?: bigint;
}): string =>
  getPrivateCommandUrl(
    botName,
    'subscription',
    `${editSubscriptionKey}=${subscriptionId}=${action}=${groupId ?? 0}`
  );
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const parseEditSubscriptionData = (data: string) => ({
  subscriptionId: BigInt(
    required(data.split(' ')[1], 'subscriptionId is required in callback data')
  ),
  action: required(
    data.split(' ')[2] as EditSubscriptionAction,
    'action is required in callback data'
  ),
  groupId:
    BigInt(required(data.split(' ')[3], 'groupId is required in callback data')) || undefined,
});

const helpKey = 'help';
export const makeHelpUrl = ({ botName }: { botName: string }): string =>
  getPrivateCommandUrl(botName, 'subscription', helpKey);

export async function route(
  msg: TelegramBot.Message,
  db: DbService,
  telegramBot: TelegramBotService
): Promise<boolean> {
  const command = getCommandParameter(msg);
  const user = msg.from;

  if (user == null) {
    return false;
  }

  const key = command.split(' ')[0];

  switch (key) {
    case groupKey: {
      await subscribeToGroup({
        ...parseGroupParams(command),
        db,
        telegramBot,
        user,
      });
      return true;
    }

    case objectKey: {
      const params = {
        ...parseObjectParams(command),
        db,
        telegramBot,
        user,
      };

      if (params.object === ObjectType.subscription) {
        await editSubscription({
          ...params,
          id: required(params.id, 'subscription id is required'),
        });
      } else if (params.object === ObjectType.group && params.id == null) {
        await subscribeFromGroupInstructions(telegramBot, user.id, 'subscribe');
      } else {
        await chooseTariff({
          ...params,
          id: required(params.id, 'object id is required'),
        });
      }
      return true;
    }

    case tariffKey: {
      await tariffChosen({
        ...parseTariffParams(command),
        db,
        telegramBot,
        user,
      });
      return true;
    }

    case editSubscriptionKey: {
      await doEditSubscription({
        ...parseEditSubscriptionData(command),
        db,
        telegramBot,
        user,
      });
      return true;
    }

    case helpKey: {
      await help(telegramBot, user.id);
      return true;
    }

    default: {
      return false;
    }
  }
}
