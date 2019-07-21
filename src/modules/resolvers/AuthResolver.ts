import { Resolver, Arg, Mutation, Args, ArgsType, Field, Ctx } from 'type-graphql';
import { User } from '../entity/User';
import { Length } from 'class-validator';
import { ResolverContext } from '../../types/ResolverContext';
import { comparePasswords, hashPassword } from '../../utils/crypto';
import { SESSION_COOKIE_NAME } from '../../config/envConfig';
import { sendMail } from '../../mails/mailer';
import { MailTemplateType } from '../../types/Mailer';

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
      return null;
    }

    const valid = comparePasswords(password, user.password);

    if (!valid) {
      return null;
    }

    ctx.req.session!.userId = user.id;

    return user;
  }

  @Mutation(() => Boolean)
  logout(@Ctx() ctx: ResolverContext): Promise<Boolean> {
    return new Promise((resolve, reject) => {
      ctx.req.session!.destroy(error => {
        if (error) {
          return reject(false);
        }

        ctx.res.clearCookie(SESSION_COOKIE_NAME);
        return resolve(true);
      });
    });
  }
}
