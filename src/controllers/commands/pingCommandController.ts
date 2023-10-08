import type PackageJson from '../../../package.json';
import { getEnv } from '../../config/envVars.ts';
import { dirname } from '@darkobits/fd-name';
import fs from 'node:fs';
import path from 'node:path';
import { required } from '../../lib/common.ts';
import { t } from '../../config/translations/index.ts';
import type ChatController from '../ChatController.ts';

const packageJson = JSON.parse(
  fs.readFileSync(path.join(required(dirname()), '../../../package.json'), 'utf8')
) as typeof PackageJson;

const pingCommandController: ChatController = ({ chat$, chatId, services }) => {
  chat$.subscribe((msg) =>
    services.telegramBot.sendMessage(chatId, getPingResponseMessage(chatId, msg.from?.id))
  );
};

export default pingCommandController;

export const getPingResponseMessage = (chatId: number, userId?: number): string =>
  t('ping.response', {
    nodeEnv: getEnv().NODE_ENV ?? 'unknown',
    version: packageJson.version,
    chatId,
    userId,
  });
