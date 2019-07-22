import { v4 } from 'uuid';
import { redis } from '../../config/redis';

const mailContent = async (userId: number) => {
  const activationToken = v4();
  await redis.set(activationToken, userId, 'ex', 60 * 60 * 24); // 1 day

  // TODO change hardcoded url
  return `<p>Activation code: http://localhost:3000/activate/${userId}/${activationToken}</p>`;
};

module.exports = {
  subject: 'Activate account',
  html: mailContent,
};
