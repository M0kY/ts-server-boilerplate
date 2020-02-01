import { MiddlewareInterface, ResolverData, NextFn } from 'type-graphql';
import { Inject } from 'typedi';
import { ResolverContext } from '../types/ResolverContext';
import { UserService } from '../modules/services/UserService';
import { CustomError, getErrorByKey, ERROR_USER_NOT_ACTIVE } from '../constants/errorCodes';

export class PermissionsMiddleware implements MiddlewareInterface<ResolverContext> {
  constructor(@Inject(() => UserService) private readonly userService: UserService) {}

  async use({ context, info }: ResolverData<ResolverContext>, next: NextFn) {
    const user = await this.userService.findById(context.req.session!.userId);

    if (user) {
      // Ignore check for "me" resolver to be able to fetch user data
      if (!user.activated && info.fieldName !== 'me') {
        throw new CustomError(getErrorByKey(ERROR_USER_NOT_ACTIVE));
      }

      if (user.locked) {
        throw new CustomError(getErrorByKey(ERROR_USER_NOT_ACTIVE));
      }

      if (user.disabled) {
        throw new CustomError(getErrorByKey(ERROR_USER_NOT_ACTIVE));
      }
    }

    return next();
  }
}
