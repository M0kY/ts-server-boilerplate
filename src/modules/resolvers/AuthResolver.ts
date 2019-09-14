import { Resolver, Arg, Mutation, Args, ArgsType, Field, Ctx, ObjectType, ID } from 'type-graphql';
import { Length } from 'class-validator';
import { authenticator } from 'otplib';
import { User } from '../entity/User';
import { ResolverContext } from '../../types/ResolverContext';
import { comparePasswords, hashPassword } from '../../utils/crypto';
import { SESSION_COOKIE_NAME } from '../../config/envConfig';
import { sendMail } from '../../mails/mailer';
import { MailTemplateType } from '../../types/Mailer';
import { redis } from '../../config/redis';
import { USER_ACTIVATION_PREFIX, USER_RESET_PASSWORD_PREFIX } from '../../constants/redisPrefixes';
import {
  CustomError,
  getErrorByKey,
  ERROR_INVALID_LOGIN,
  ERROR_USER_NOT_LOGGED_IN,
  ERROR_INVALID_TOKEN,
  ERROR_USER_NOT_FOUND,
  ERROR_USER_ALREADY_ACTIVE,
  ERROR_2FA_TOKEN_REQUIRED,
} from '../../constants/errorCodes';
import { UserService } from '../services/UserService';
import { Inject } from 'typedi';
import { RegisterInput } from '../../types/ResolverTypes';

@ObjectType()
class ActivationData {
  @Field(() => ID)
  id: string;
  @Field(() => Boolean)
  activated: boolean;
}

@ArgsType()
class ResetPasswordInput {
  @Field(() => ID)
  userId: string;

  @Field()
  resetToken: string;

  @Field()
  @Length(8, 72)
  newPassword: string;
}

@ObjectType()
class ResetPasswordData {
  @Field(() => ID)
  id: string;
  @Field(() => Boolean)
  passwordUpdated: boolean;
}

@Resolver(User)
export class AuthResolver {
  constructor(@Inject(() => UserService) private readonly userService: UserService) {}

  @Mutation(() => User, { nullable: true })
  async register(@Args() { username, email, password }: RegisterInput): Promise<User> {
    const user = await this.userService.createUser({ username, email, password });

    await sendMail(user.email, MailTemplateType.ACCOUNT_ACTIVATION, user);

    return user;
  }

  @Mutation(() => User, { nullable: true })
  async login(
    @Arg('username') username: string,
    @Arg('password') password: string,
    @Ctx() ctx: ResolverContext,
    @Arg('token', { nullable: true }) token?: string
  ): Promise<User | null> {
    const user = await this.userService.findByUsernameOrEmail(username);

    if (!user) {
      throw new CustomError(getErrorByKey(ERROR_INVALID_LOGIN));
    }

    const valid = comparePasswords(password, user.password);

    if (!valid) {
      throw new CustomError(getErrorByKey(ERROR_INVALID_LOGIN));
    }

    if (user.enabled2fa) {
      if (!token) {
        throw new CustomError(getErrorByKey(ERROR_2FA_TOKEN_REQUIRED));
      }

      const isTokenValid = authenticator.verify({ token, secret: user.secret2fa! });

      if (!isTokenValid) {
        throw new CustomError(getErrorByKey(ERROR_INVALID_LOGIN));
      }
    }

    ctx.req.session!.userId = user.id;

    return user;
  }

  @Mutation(() => Boolean)
  logout(@Ctx() ctx: ResolverContext): Promise<Boolean> {
    return new Promise((resolve, reject) => {
      if (!ctx.req.session!.userId) {
        throw new CustomError(getErrorByKey(ERROR_USER_NOT_LOGGED_IN));
      } else {
        ctx.req.session!.destroy(error => {
          if (error) {
            return reject(false);
          }

          ctx.res.clearCookie(SESSION_COOKIE_NAME);
          return resolve(true);
        });
      }
    });
  }

  @Mutation(() => ActivationData)
  async activate(@Arg('userId', () => ID) userId: string, @Arg('token') token: string): Promise<ActivationData> {
    const id = await redis.get(USER_ACTIVATION_PREFIX + token);

    if (!id || id !== userId) {
      throw new CustomError(getErrorByKey(ERROR_INVALID_TOKEN));
    }

    const user = await this.userService.findById(userId);

    if (!user) {
      throw new CustomError(getErrorByKey(ERROR_USER_NOT_FOUND));
    }

    if (user.activated) {
      throw new CustomError(getErrorByKey(ERROR_USER_ALREADY_ACTIVE));
    }

    await this.userService.updateUser(userId, { activated: true });
    await redis.del(USER_ACTIVATION_PREFIX + token);

    return { id: userId, activated: user.activated };
  }

  @Mutation(() => Boolean)
  async resendActivationLink(@Arg('email') email: string): Promise<Boolean> {
    const user = await this.userService.findByEmail(email);
    if (user) {
      await sendMail(user.email, MailTemplateType.ACCOUNT_ACTIVATION, user);
    }

    return true;
  }

  @Mutation(() => Boolean)
  async resetPasswordRequest(@Arg('email') email: string): Promise<Boolean> {
    const user = await this.userService.findByEmail(email);
    if (user) {
      await sendMail(user.email, MailTemplateType.PASSWORD_RESET, user);
    }

    return true;
  }

  @Mutation(() => ResetPasswordData)
  async resetPassword(@Args() { userId, resetToken, newPassword }: ResetPasswordInput): Promise<ResetPasswordData> {
    const id = await redis.get(USER_RESET_PASSWORD_PREFIX + resetToken);

    if (!id || id !== userId) {
      throw new CustomError(getErrorByKey(ERROR_INVALID_TOKEN));
    }

    const user = await this.userService.findById(userId);

    if (!user) {
      throw new CustomError(getErrorByKey(ERROR_USER_NOT_FOUND));
    }

    await this.userService.updateUser(userId, { password: hashPassword(newPassword) });
    await redis.del(USER_RESET_PASSWORD_PREFIX + resetToken);

    return { id: userId, passwordUpdated: true };
  }
}
