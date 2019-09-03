import bcrypt from 'bcrypt';
import { createHmac } from 'crypto';
import { BCRYPT_SALT_ROUNDS, PASSWORD_HMAC_SECRET } from '../config/envConfig';

const generateHmacSha256Hash = (password: string, secret: string = PASSWORD_HMAC_SECRET) => {
  return createHmac('sha256', secret)
    .update(password)
    .digest('base64');
};

export const hashPassword = (password: string): string => {
  const hmacPasswordHash = generateHmacSha256Hash(password);
  return bcrypt.hashSync(hmacPasswordHash, BCRYPT_SALT_ROUNDS);
};

export const comparePasswords = (password: string, hashedPassword: string): boolean => {
  const hmacPasswordHash = generateHmacSha256Hash(password);
  return bcrypt.compareSync(hmacPasswordHash, hashedPassword);
};
