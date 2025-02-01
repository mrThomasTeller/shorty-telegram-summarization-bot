import { dirname } from '@darkobits/fd-name';
import path from 'node:path';
import winston, { format } from 'winston';
import { required } from '../lib/common/lang';
import tb from 'triple-beam';
const { combine, timestamp, printf, colorize } = format;

export type LogLevel = 'error' | 'warn' | 'info';

const timeFormat = (): string => {
  return new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }).replace(',', '');
};

const fileLogFormat = printf(({ level, message, timestamp }) => {
  return `${String(timestamp)} ${level}: ${String(message)}`;
});

const consoleLogFormat = printf(
  ({ level, message, [tb.LEVEL]: levelStr, [tb.MESSAGE]: messageObj }) => {
    return `${level}: ${String(levelStr === 'error' ? messageObj : message)}`;
  }
);

const logger = winston.createLogger({
  level: 'debug',
  transports: [
    new winston.transports.File({
      filename: path.join(required(dirname()), '../../logs/tg-bot.log'),
      format: combine(timestamp({ format: timeFormat }), fileLogFormat),
    }),
    new winston.transports.Console({
      format: combine(format.errors({ stack: true }), colorize(), consoleLogFormat),
    }),
  ],
});

export default logger;
