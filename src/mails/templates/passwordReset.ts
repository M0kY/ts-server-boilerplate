import { v4 } from 'uuid';
import { redis } from '../../config/redis';
import { USER_RESET_PASSWORD_PREFIX } from '../../constants/redisPrefixes';

const mailContent = async (userId: number) => {
  const resetPasswordToken = v4();
  await redis.set(USER_RESET_PASSWORD_PREFIX + resetPasswordToken, userId, 'ex', 60 * 60 * 24); // 1 day

  // TODO change hardcoded url
  return `<p>Activation code: http://localhost:3000/reset-password/${userId}/${resetPasswordToken}</p>`;
};

module.exports = {
  subject: 'Reset password',
  html: mailContent,
};
