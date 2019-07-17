import { Resolver, Query, Arg, Mutation, Args, ArgsType, Field, Int, Ctx } from 'type-graphql';
import { User } from '../entity/User';
import { Length } from 'class-validator';
import { ResolverContext } from '../types/ResolverContext';
import { comparePasswords, hashPassword } from '../../utils/crypto';

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
      username,
      email,
      password: hashedPassword,
    }).save();
    return user;
  }

  @Mutation(() => User, { nullable: true })
  async login(
    @Arg('username') username: string,
    @Arg('password') password: string,
    @Ctx() ctx: ResolverContext
  ): Promise<User | null> {
    const user = await User.findOne({ where: { username } });

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

  @Query(() => User, { nullable: true })
  async getUser(@Arg('id', () => Int) id: number): Promise<User | undefined | null> {
    const user = User.findOne({ where: { id } });

    return user || null;
  }

  @Query(() => [User])
  async getAllUsers(): Promise<User[] | undefined | []> {
    const user = User.find();
    return user || [];
  }
}
