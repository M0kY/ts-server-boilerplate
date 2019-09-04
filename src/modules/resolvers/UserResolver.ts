import { Resolver, Query, Mutation, Field, Ctx, Authorized, InputType, Arg, ID, ObjectType } from 'type-graphql';
import { authenticator } from 'otplib';

import { User } from '../entity/User';
import { ResolverContext } from '../../types/ResolverContext';
import { hashPassword, comparePasswords } from '../../utils/crypto';
import { Role } from '../../types/Roles';
import {
  CustomError,
  getErrorByKey,
  ERROR_USER_NOT_FOUND,
  ERROR_WHILE_UPDATING_USER,
  ERROR_INVALID_PASSWORD_INPUT,
  ERROR_INVALID_2FA_TOKEN,
  ERROR_NO_2FA_SECRET,
  ERROR_2FA_ALREADY_VERIFIED,
  ERROR_2FA_NOT_ACTIVE,
} from '../../constants/errorCodes';
import { SERVICE_NAME } from '../../config/envConfig';

@InputType({ description: 'User profile data which can be updated' })
class UpdateProfileInput implements Partial<User> {
  [key: string]: string;

  @Field({ nullable: true })
  email: string;

  @Field({ nullable: true })
  firstName: string;

  @Field({ nullable: true })
  lastName: string;
}

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
  @Authorized()
  @Query(() => User, { nullable: true })
  async me(@Ctx() ctx: ResolverContext): Promise<User> {
    const user = await User.findOne({ where: { id: ctx.req.session!.userId } });

    if (!user) {
      throw new CustomError(getErrorByKey(ERROR_USER_NOT_FOUND));
    }

    return user;
  }

  @Authorized(Role.ADMIN)
  @Query(() => [User])
  async getAllUsers(): Promise<User[]> {
    const user = await User.find();
    return user || [];
  }

  @Authorized()
  @Mutation(() => ChangePasswordData, { nullable: true })
  async changePassword(
    @Arg('currentPassword') currentPassword: string,
    @Arg('newPassword') newPassword: string,
    @Ctx() ctx: ResolverContext
  ): Promise<ChangePasswordData> {
    const user = await User.findOne({ where: { id: ctx.req.session!.userId } });

    if (!user) {
      throw new CustomError(getErrorByKey(ERROR_USER_NOT_FOUND));
    }

    if (!comparePasswords(currentPassword, user.password)) {
      throw new CustomError({
        ...getErrorByKey(ERROR_INVALID_PASSWORD_INPUT),
        properties: { invalidArgument: 'currentPassword' },
      });
    }

    user.password = hashPassword(newPassword);
    await user.save();

    return { id: user.id.toString(), passwordChanged: true };
  }

  @Authorized()
  @Mutation(() => User, { nullable: true })
  async updateProfile(@Arg('data') updateProfileData: UpdateProfileInput, @Ctx() ctx: ResolverContext): Promise<User> {
    const user: any = await User.findOne({ where: { id: ctx.req.session!.userId } });

    if (!user) {
      throw new CustomError(getErrorByKey(ERROR_USER_NOT_FOUND));
    }

    Object.keys(updateProfileData).forEach(key => {
      user[key] = updateProfileData[key];
    });

    await user.save().catch((_: Error) => {
      throw new CustomError(getErrorByKey(ERROR_WHILE_UPDATING_USER));
    });
    return user;
  }

  @Authorized()
  @Mutation(() => Activate2faData)
  async activate2fa(@Ctx() ctx: ResolverContext): Promise<Activate2faData> {
    const user = await User.findOne({ where: { id: ctx.req.session!.userId } });

    if (!user) {
      throw new CustomError(getErrorByKey(ERROR_USER_NOT_FOUND));
    }

    if (user.enabled2fa) {
      throw new CustomError(getErrorByKey(ERROR_2FA_ALREADY_VERIFIED));
    }

    const secret = authenticator.generateSecret();

    user.secret2fa = secret;

    await user.save().catch((_: Error) => {
      throw new CustomError(getErrorByKey(ERROR_WHILE_UPDATING_USER));
    });

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
    const user = await User.findOne({ where: { id: ctx.req.session!.userId } });

    if (!user) {
      throw new CustomError(getErrorByKey(ERROR_USER_NOT_FOUND));
    }

    if (!user.secret2fa) {
      throw new CustomError(getErrorByKey(ERROR_NO_2FA_SECRET));
    }

    const isValid = authenticator.verify({ token, secret: user.secret2fa });

    if (!isValid) {
      throw new CustomError(getErrorByKey(ERROR_INVALID_2FA_TOKEN));
    }

    if (enable) {
      if (user.enabled2fa) {
        throw new CustomError(getErrorByKey(ERROR_2FA_ALREADY_VERIFIED));
      }

      user.enabled2fa = true;
    } else {
      if (!user.enabled2fa) {
        throw new CustomError(getErrorByKey(ERROR_2FA_NOT_ACTIVE));
      }

      user.enabled2fa = false;
      user.secret2fa = null;
    }

    await user.save().catch((_: Error) => {
      throw new CustomError(getErrorByKey(ERROR_WHILE_UPDATING_USER));
    });

    return true;
  }
}
