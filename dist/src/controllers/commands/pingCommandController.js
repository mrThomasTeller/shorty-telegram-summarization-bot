// import type PackageJson from '../../../package.json';
import { getEnv } from '../../config/envVars.js';
import { dirname } from '@darkobits/fd-name';
import fs from 'node:fs';
import path from 'node:path';
import { required } from '../../lib/common.js';
import { t } from '../../config/translations/index.js';
const packageJson = JSON.parse(
  fs.readFileSync(
    path.join(required(dirname()), '../../../../package.json'),
    'utf8'
  )
);
const pingCommandController = ({ chat$, chatId, services }) => {
  chat$.subscribe((msg) =>
    services.telegramBot.sendMessage(
      chatId,
      getPingResponseMessage(chatId, msg.from?.id)
    )
  );
};
export default pingCommandController;
export const getPingResponseMessage = (chatId, userId) =>
  t('ping.response', {
    nodeEnv: getEnv().NODE_ENV,
    version: packageJson.version,
    chatId,
    userId,
  });
