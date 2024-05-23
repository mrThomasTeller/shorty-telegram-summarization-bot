import { of } from 'rxjs';
import { t } from '../../config/translations/index.ts';
import { getCommandParams } from '../../data/telegramBotMessageUtils.ts';
import { isTruthy, oneOf, required } from '../../lib/lang.ts';
import type ChatController from '../ChatController.ts';
import tariffCommandController from './tariffCommandController.ts';
import { getEnv } from '../../config/envVars.ts';

const activateCommandController: ChatController = ({ chat$, chatId, services }) => {
  chat$.subscribe(async (msg) => {
    const [context, key] = getCommandParams(msg.text ?? '')
      .split(' ')
      .map((s) => s.trim());

    const activationKey = isTruthy(key) ? await services.db.getActivationKey(key) : undefined;

    if (
      !oneOf(context, ['chat', 'user']) ||
      !activationKey ||
      activationKey.usedForSubscriptionId != null
    ) {
      await services.telegramBot.sendMessage(chatId, t('commands.activate.errors.badKey'), {
        parse_mode: 'HTML',
      });
      return;
    }

    if (context === 'chat' && msg.chat.type === 'private') {
      const botName = await services.telegramBot.getUsername();
      await services.telegramBot.sendMessage(
        chatId,
        t('commands.activate.errors.useChat', { botName, key }),
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    const user = required(msg.from);
    const { id: subscriptionId } = await services.db.setSubscription(
      context === 'chat' ? { chatId } : { userId: user.id },
      user,
      activationKey.tariffId
    );

    await services.db.setActivationKeyUsedForSubscription(activationKey.id, subscriptionId);

    tariffCommandController({ chat$: of(msg), chatId, services });

    const { id: newKey } = await services.db.createActivationKey(activationKey.tariffId);

    await services.telegramBot.sendMessage(
      getEnv().ADMIN_ID,
      t('commands.activate.adminNotification', {
        tariff: activationKey.tariffId,
        key: newKey,
      }),
      {
        parse_mode: 'HTML',
      }
    );
  });
};

export default activateCommandController;
