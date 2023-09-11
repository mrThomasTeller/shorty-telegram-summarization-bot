/* eslint-disable no-console */
import fs from 'node:fs';
import path from 'node:path';
import util from 'node:util';
import { required } from '../lib/common.ts';
import { dirname } from '@darkobits/fd-name';

// redirect console.* to file /logs/app.log
export function enableLogToFile(): void {
  const logsDir = path.join(required(dirname()), '../../logs');
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);
  const logFile = fs.createWriteStream(path.join(logsDir, 'app.log'), { flags: 'a' });
  const logStdout = process.stdout;

  console.log =
    console.error =
    console.warn =
    console.info =
    console.debug =
      function () {
        logFile.write(Reflect.apply(util.format, null, arguments) + '\n');
        logStdout.write(Reflect.apply(util.format, null, arguments) + '\n');
      };
}
