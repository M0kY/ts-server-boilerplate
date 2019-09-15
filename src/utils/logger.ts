import { createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const { combine, timestamp, printf, colorize } = format;

const colorizer = colorize();

const dailyRotateFileOpts = {
  filename: './logs/application-%DATE%.log',
  datePattern: 'YYYY-MM-DD-HH',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
};

const loggerFormat = printf(({ level, message, label, timestamp }) => {
  const addLabelToLog = label ? ` - [${label}]` : '';
  return `[${timestamp}] ${level.toUpperCase()}${addLabelToLog} : ${message}`;
});

const consoleLoggerFormat = printf(({ level, message, label, timestamp }) => {
  const addLabelToLog = label ? ` - [${label}]` : '';
  return colorizer.colorize(level, `[${timestamp}] ${level.toUpperCase()}${addLabelToLog} : ${message}`);
});

export const logger = createLogger({
  level: 'verbose',
  format: combine(timestamp(), loggerFormat),
  transports: [
    new transports.Console({
      format: combine(timestamp(), consoleLoggerFormat),
    }),
    new DailyRotateFile(dailyRotateFileOpts),
  ],
});
