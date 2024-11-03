import type PackageJson from '../../../package.json';
import { getEnv } from '../../config/envVars';
import { dirname } from '@darkobits/fd-name';
import fs from 'node:fs';
import path from 'node:path';
import { required } from '../../lib/common/lang';
import { t } from '../../config/translations/index';
import type ChatController from '../ChatController';

const packageJson = JSON.parse(
  fs.readFileSync(path.join(required(dirname()), '../../../package.json'), 'utf8')
) as typeof PackageJson;

const pingCommandController: ChatController = ({ chat$, chatId, services }) => {
  chat$.subscribe((msg) =>
    services.telegramBot.sendMessage(
      chatId,
      getPingResponseMessage(chatId, msg.from?.id, msg.from?.username)
    )
  );
};

export default pingCommandController;

export const getPingResponseMessage = (
  chatId: number,
  userId?: number,
  username?: string
): string =>
  t('ping.response', {
    nodeEnv: getEnv().NODE_ENV,
    version: packageJson.version,
    chatId,
    userId,
    username,
  });
