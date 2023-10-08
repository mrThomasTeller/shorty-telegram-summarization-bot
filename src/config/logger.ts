import winston, { format } from 'winston';
const { combine, timestamp, printf, colorize } = format;

export type LogLevel = 'error' | 'warn' | 'info';

const myFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} ${level}: ${message}`;
});

const logger = winston.createLogger({
  level: 'info',
  format: combine(timestamp({ format: 'DD.MM.YYYY HH:mm:ss' }), colorize(), myFormat),
  transports: [
    // new winston.transports.File({ filename: 'error.log', level: 'error' }),
    // new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console(),
  ],
});

export default logger;
