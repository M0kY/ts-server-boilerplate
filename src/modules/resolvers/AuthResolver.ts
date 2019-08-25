import { Resolver, Arg, Mutation, Args, ArgsType, Field, Ctx, ObjectType, ID } from 'type-graphql';
import { Length } from 'class-validator';
import { AuthenticationError, ForbiddenError } from 'apollo-server-errors';
import { User } from '../entity/User';
import { ResolverContext } from '../../types/ResolverContext';
import { comparePasswords, hashPassword } from '../../utils/crypto';
import { SESSION_COOKIE_NAME } from '../../config/envConfig';
import { sendMail } from '../../mails/mailer';
import { MailTemplateType } from '../../types/Mailer';
import { redis } from '../../config/redis';
import { USER_ACTIVATION_PREFIX, USER_RESET_PASSWORD_PREFIX } from '../../constants/redisPrefixes';

@ObjectType()
class ActivationData {
  @Field(() => ID)
  id: string;
  @Field(() => Boolean)
  activated: boolean;
}

@ArgsType()
class LoginInput {
  @Field()
  username: string;

  @Field()
  @Length(8, 72)
  password: string;
}

@ArgsType()
class RegisterInput extends LoginInput {
  @Field()
  email: string;
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
  @Mutation(() => User, { nullable: true })
  async register(@Args() { username, email, password }: RegisterInput): Promise<User> {
    const hashedPassword = hashPassword(password);
    const user = await User.create({
      username: username.toLowerCase(),
      displayName: username,
      email: email.toLowerCase(),
      password: hashedPassword,
    }).save();

    await sendMail(user.email, MailTemplateType.ACCOUNT_ACTIVATION, user);

    return user;
  }

  @Mutation(() => User, { nullable: true })
  async login(
    @Arg('username') username: string,
    @Arg('password') password: string,
    @Ctx() ctx: ResolverContext
  ): Promise<User | null> {
    const user = await User.findOne({
      where: [{ username: username.toLowerCase() }, { email: username.toLowerCase() }],
    });

    if (!user) {
      throw new AuthenticationError('Invalid username or password');
    }

    const valid = comparePasswords(password, user.password);

    if (!valid) {
      throw new AuthenticationError('Invalid username or password');
    }

    ctx.req.session!.userId = user.id;

    return user;
  }

  @Mutation(() => Boolean)
  logout(@Ctx() ctx: ResolverContext): Promise<Boolean> {
    return new Promise((resolve, reject) => {
      if (!ctx.req.session!.userId) {
        throw new AuthenticationError('Not logged in');
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
    const user = await User.findOne({ id: parseInt(userId, 10) });

    if (!id || id !== userId) {
      throw new AuthenticationError('Invalid token');
    }

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    if (user.activated) {
      throw new ForbiddenError('User already active');
    }

    user.activated = true;
    await user.save();
    await redis.del(USER_ACTIVATION_PREFIX + token);

    return { id: userId, activated: user.activated };
  }

  @Mutation(() => Boolean)
  async resendActivationLink(@Arg('email') email: string): Promise<Boolean> {
    const user = await User.findOne({ email });
    if (user) {
      await sendMail(user.email, MailTemplateType.ACCOUNT_ACTIVATION, user);
    }

    return true;
  }

  @Mutation(() => Boolean)
  async resetPasswordRequest(@Arg('email') email: string): Promise<Boolean> {
    const user = await User.findOne({ email });
    if (user) {
      await sendMail(user.email, MailTemplateType.PASSWORD_RESET, user);
    }

    return true;
  }

  @Mutation(() => ResetPasswordData)
  async resetPassword(@Args() { userId, resetToken, newPassword }: ResetPasswordInput): Promise<ResetPasswordData> {
    const id = await redis.get(USER_RESET_PASSWORD_PREFIX + resetToken);
    const user = await User.findOne({ id: parseInt(userId, 10) });

    if (!id || id !== userId) {
      throw new AuthenticationError('Invalid token');
    }

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    user.password = hashPassword(newPassword);
    await user.save();
    await redis.del(USER_RESET_PASSWORD_PREFIX + resetToken);

    return { id: userId, passwordUpdated: true };
  }
}
