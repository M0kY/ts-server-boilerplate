import { AuthChecker } from 'type-graphql';
import { getRepository } from 'typeorm';
import { ResolverContext } from '../types/ResolverContext';
import { User } from '../modules/entity/User';
import { Role } from '../types/Roles';

export const authChecker: AuthChecker<ResolverContext> = async ({ context }, roles) => {
  const userRepository = getRepository(User);
  const user = await userRepository.findOne({ id: context.req.session!.userId });
  if (!user) {
    return false;
  }

  if (roles.length === 0 || user.role === Role.ADMIN) {
    return true;
  }

  if (roles.includes(user.role as any)) {
    return true;
  }

  return false;
};
