import { dirname } from '@darkobits/fd-name';
import path from 'node:path';
import winston, { format } from 'winston';
import { required } from '../lib/common.js';
const { combine, timestamp, printf, colorize } = format;
const timeFormat = () => {
    return new Date()
        .toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })
        .replace(',', '');
};
const fileLogFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} ${level}: ${message}`;
});
const consoleLogFormat = printf(({ level, message }) => {
    return `${level}: ${message}`;
});
const logger = winston.createLogger({
    level: 'info',
    transports: [
        new winston.transports.File({
            filename: path.join(required(dirname()), '../../logs/tg-bot.log'),
            format: combine(timestamp({ format: timeFormat }), fileLogFormat),
        }),
        new winston.transports.Console({
            format: combine(colorize(), consoleLogFormat),
        }),
    ],
});
export default logger;
