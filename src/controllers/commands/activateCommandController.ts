import { of } from 'rxjs';
import logger from '../../config/logger.ts';
import { t } from '../../config/translations/index.ts';
import { getCommandParams } from '../../data/telegramBotMessageUtils.ts';
import { isTruthy } from '../../lib/lang.ts';
import type ChatController from '../ChatController.ts';
import tariffCommandController from './tariffCommandController.ts';

const activateCommandController: ChatController = ({ chat$, chatId, services }) => {
  chat$.subscribe(async (msg) => {
    try {
      const key = getCommandParams(msg.text ?? '');

      const activationKey = isTruthy(key) ? await services.db.getActivationKey(key) : undefined;

      if (
        !activationKey ||
        activationKey.used ||
        !msg.from ||
        activationKey.userId !== BigInt(msg.from.id) ||
        activationKey.subscriptionId == null
      ) {
        await services.telegramBot.sendMessage(chatId, t('commands.activate.errors.badKey'), {
          parse_mode: 'HTML',
        });

        logger.warn('Bad activation key: ' + JSON.stringify({ key, activationKey }));

        return;
      }

      await services.db.getOrCreateChat(chatId);
      await services.db.updateSubscription(activationKey.subscriptionId, {
        chatId: BigInt(chatId),
      });

      await services.db.updateActivationKey(activationKey.id, { used: true });

      // todo sub показывать инфу именно о только что активированной подписке
      tariffCommandController({ chat$: of(msg), chatId, services });
    } catch (error) {
      logger.error('Error in activateCommandController', error);
    }
  });
};

export default activateCommandController;
