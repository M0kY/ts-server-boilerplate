import { Resolver, Query, Arg, Int, Mutation, Args, Field, ArgsType, Ctx } from 'type-graphql';
import { User } from '../entity/User';
import { Length } from 'class-validator';
import { ResolverContext } from '../types/ResolverContext';
import { hashPassword } from '../../utils/crypto';

@ArgsType()
class UpdateProfileInput {
  @Field({ nullable: true })
  @Length(8, 72)
  password: string;

  @Field({ nullable: true })
  email: string;

  @Field({ nullable: true })
  firstName: string;

  @Field({ nullable: true })
  lastName: string;
}

@Resolver(User)
export class UserResolver {
  @Query(() => User, { nullable: true })
  async getUser(@Arg('id', () => Int) id: number): Promise<User | undefined | null> {
    const user = await User.findOne({ where: { id } });

    return user || null;
  }

  @Query(() => [User])
  async getAllUsers(): Promise<User[] | undefined | []> {
    const user = await User.find();
    return user || [];
  }

  @Mutation(() => User, { nullable: true })
  async updateProfile(
    @Args() { password, email, firstName, lastName }: UpdateProfileInput,
    @Ctx() ctx: ResolverContext
  ): Promise<User | null> {
    const user = await User.findOne({ where: { id: ctx.req.session!.userId } });

    if (!user) {
      return null;
    }

    password && (user.password = hashPassword(password));
    email && (user.email = email);
    firstName && (user.firstName = firstName);
    lastName && (user.lastName = lastName);

    user.save();

    return user;
  }
}
