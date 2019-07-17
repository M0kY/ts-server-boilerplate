import bcrypt from 'bcrypt';
import { BCRYPT_SALT_ROUNDS } from '../config/envConfig';

export const hashPassword = (password: string): string => {
  return bcrypt.hashSync(password, BCRYPT_SALT_ROUNDS);
};

export const comparePasswords = (password: string, hashedPassword: string): boolean => {
  return bcrypt.compareSync(password, hashedPassword);
};
