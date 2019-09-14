import { Resolver, Query, Mutation, Field, Ctx, Authorized, Arg, ID, ObjectType } from 'type-graphql';
import { authenticator } from 'otplib';

import { User } from '../entity/User';
import { ResolverContext } from '../../types/ResolverContext';
import { comparePasswords } from '../../utils/crypto';
import { Role } from '../../types/Roles';
import {
  CustomError,
  getErrorByKey,
  ERROR_INVALID_PASSWORD_INPUT,
  ERROR_INVALID_2FA_TOKEN,
  ERROR_NO_2FA_SECRET,
  ERROR_2FA_ALREADY_VERIFIED,
  ERROR_2FA_NOT_ACTIVE,
} from '../../constants/errorCodes';
import { SERVICE_NAME } from '../../config/envConfig';
import { UserService } from '../services/UserService';
import { Inject } from 'typedi';
import { UpdateProfileInput, User2faDTO } from '../../types/ResolverTypes';

@ObjectType()
class ChangePasswordData {
  @Field(() => ID)
  id: string;
  @Field(() => Boolean)
  passwordChanged: boolean;
}

@ObjectType()
class Activate2faData {
  @Field()
  secret: string;
  @Field()
  method: 'TOTP' | 'HOTP';
  @Field()
  uri: string;
}

@Resolver(User)
export class UserResolver {
  constructor(@Inject(() => UserService) private readonly userService: UserService) {}

  @Authorized()
  @Query(() => User, { nullable: true })
  async me(@Ctx() ctx: ResolverContext): Promise<User> {
    return await this.userService.findById(ctx.req.session!.userId);
  }

  @Authorized(Role.ADMIN)
  @Query(() => [User])
  async getAllUsers(): Promise<User[]> {
    return await this.userService.getAll();
  }

  @Authorized()
  @Mutation(() => ChangePasswordData, { nullable: true })
  async changePassword(
    @Arg('currentPassword') currentPassword: string,
    @Arg('newPassword') newPassword: string,
    @Ctx() ctx: ResolverContext,
    @Arg('token', { nullable: true }) token?: string
  ): Promise<ChangePasswordData> {
    const user = await this.userService.findById(ctx.req.session!.userId);

    if (!comparePasswords(currentPassword, user.password)) {
      throw new CustomError({
        ...getErrorByKey(ERROR_INVALID_PASSWORD_INPUT),
        properties: { invalidArgument: 'currentPassword' },
      });
    }

    if (user.enabled2fa) {
      if (!token) {
        throw new CustomError(getErrorByKey(ERROR_INVALID_2FA_TOKEN));
      }

      const isTokenValid = authenticator.verify({ token, secret: user.secret2fa! });

      if (!isTokenValid) {
        throw new CustomError(getErrorByKey(ERROR_INVALID_2FA_TOKEN));
      }
    }

    await this.userService.updatePassword(user, newPassword);

    return { id: user.id.toString(), passwordChanged: true };
  }

  @Authorized()
  @Mutation(() => User, { nullable: true })
  async updateProfile(@Arg('data') updateProfileData: UpdateProfileInput, @Ctx() ctx: ResolverContext): Promise<User> {
    const user = await this.userService.updateUserProfile(ctx.req.session!.userId, updateProfileData);
    return user;
  }

  @Authorized()
  @Mutation(() => Activate2faData)
  async activate2fa(@Ctx() ctx: ResolverContext): Promise<Activate2faData> {
    const user = await this.userService.findById(ctx.req.session!.userId);

    if (user.enabled2fa) {
      throw new CustomError(getErrorByKey(ERROR_2FA_ALREADY_VERIFIED));
    }

    const secret = authenticator.generateSecret();

    await this.userService.updateUser(ctx.req.session!.userId, { secret2fa: secret });

    const uri = authenticator.keyuri(user.email, SERVICE_NAME, secret);

    return {
      secret,
      method: 'TOTP',
      uri,
    };
  }

  @Authorized()
  @Mutation(() => Boolean)
  async verifyOrDeactivate2fa(
    @Arg('token') token: string,
    @Arg('enable') enable: boolean,
    @Ctx() ctx: ResolverContext
  ): Promise<Boolean> {
    const user = await this.userService.findById(ctx.req.session!.userId);

    if (!user.secret2fa) {
      throw new CustomError(getErrorByKey(ERROR_NO_2FA_SECRET));
    }

    const isValid = authenticator.verify({ token, secret: user.secret2fa });

    if (!isValid) {
      throw new CustomError(getErrorByKey(ERROR_INVALID_2FA_TOKEN));
    }

    let update2faDTO: User2faDTO = {};

    if (enable) {
      if (user.enabled2fa) {
        throw new CustomError(getErrorByKey(ERROR_2FA_ALREADY_VERIFIED));
      }

      update2faDTO = { enabled2fa: true };
    } else {
      if (!user.enabled2fa) {
        throw new CustomError(getErrorByKey(ERROR_2FA_NOT_ACTIVE));
      }
      update2faDTO = { enabled2fa: false, secret2fa: null };
    }

    await this.userService.updateUser(ctx.req.session!.userId, update2faDTO);

    return true;
  }
}
