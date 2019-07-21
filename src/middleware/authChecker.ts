import { AuthChecker } from 'type-graphql';
import { ResolverContext } from '../modules/types/ResolverContext';
import { User } from '../modules/entity/User';
import { Role } from '../modules/types/Roles';

export const authChecker: AuthChecker<ResolverContext> = async ({ context }, roles) => {
  const user = await User.findOne({ id: context.req.session!.userId });
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
