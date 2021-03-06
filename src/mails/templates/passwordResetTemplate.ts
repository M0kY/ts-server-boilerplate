import { v4 } from 'uuid';
import { redis } from '../../config/redis';
import { USER_RESET_PASSWORD_PREFIX } from '../../constants/redisPrefixes';
import { logger } from '../../utils/logger';
import { CustomError, getErrorByKey, ERROR_WHILE_REDIS_SET } from '../../constants/errorCodes';
import { CLIENT_URL } from '../../config/envConfig';
import { IMailTemplate } from '../../types/Mailer';

const passwordResetTemplate: IMailTemplate = async userId => {
  const resetPasswordToken = v4();
  // Set token to be valid for 1 day
  await redis.set(USER_RESET_PASSWORD_PREFIX + resetPasswordToken, userId, 'ex', 60 * 60 * 24).catch((error: Error) => {
    logger.error(error);
    throw new CustomError(getErrorByKey(ERROR_WHILE_REDIS_SET));
  });

  const html = `<p>Activation code: ${CLIENT_URL}/reset-password/${userId}/${resetPasswordToken}</p>`;

  return {
    subject: 'Reset password',
    html,
  };
};

export default passwordResetTemplate;
