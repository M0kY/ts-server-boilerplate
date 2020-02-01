import { AuthChecker } from 'type-graphql';
import { getRepository } from 'typeorm';
import { ResolverContext } from '../types/ResolverContext';
import { User } from '../modules/entity/User';
import { Role } from '../types/Roles';
import { CustomError, getErrorByKey, ERROR_USER_NOT_ACTIVE } from '../constants/errorCodes';

export const authChecker: AuthChecker<ResolverContext> = async ({ context, info }, roles) => {
  const userRepository = getRepository(User);
  const user = await userRepository.findOne({ id: context.req.session!.userId });
  if (!user) {
    return false;
  }

  // Ignore check for "me" resolver to be able to fetch user data
  if (!user.activated && info.fieldName !== 'me') {
    throw new CustomError(getErrorByKey(ERROR_USER_NOT_ACTIVE));
  }

  if (roles.length === 0 || user.role === Role.ADMIN) {
    return true;
  }

  if (roles.includes(user.role as any)) {
    return true;
  }

  return false;
};
