import { v4 } from 'uuid';
import { redis } from '../../config/redis';
import { USER_RESET_PASSWORD_PREFIX } from '../../constants/redisPrefixes';
import { logger } from '../../utils/logger';
import { CustomError, getErrorByKey, ERROR_WHILE_REDIS_SET } from '../../constants/errorCodes';

const mailContent = async (userId: number) => {
  const resetPasswordToken = v4();
  // Set token to be valid for 1 day
  await redis.set(USER_RESET_PASSWORD_PREFIX + resetPasswordToken, userId, 'ex', 60 * 60 * 24).catch((error: Error) => {
    logger.error(error);
    throw new CustomError(getErrorByKey(ERROR_WHILE_REDIS_SET));
  });

  // TODO change hardcoded url
  return `<p>Activation code: http://localhost:3000/reset-password/${userId}/${resetPasswordToken}</p>`;
};

module.exports = {
  subject: 'Reset password',
  html: mailContent,
};
