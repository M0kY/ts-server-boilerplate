import Redis, { RedisOptions } from 'ioredis';
import { REDIS_HOST, REDIS_PASSWORD } from './envConfig';
import { logger } from '../utils/logger';

const options: RedisOptions = {
  host: REDIS_HOST,
  password: REDIS_PASSWORD,
  reconnectOnError: error => {
    logger.error(error.message, { label: 'REDIS RECONNECT' });
    const targetError = 'READONLY';
    if (error.message.slice(0, targetError.length) === targetError) {
      // Only reconnect when the error starts with "READONLY"
      return true;
    }
    return false;
  },
};

export const redis: Redis.Redis = new Redis(options);
