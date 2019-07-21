import { Resolver, Query, Mutation, Field, Ctx, Authorized, InputType, Arg } from 'type-graphql';
import { User } from '../entity/User';
import { ResolverContext } from '../types/ResolverContext';
import { hashPassword, comparePasswords } from '../../utils/crypto';
import { Role } from '../types/Roles';

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

@Resolver(User)
export class UserResolver {
  @Authorized()
  @Query(() => User, { nullable: true })
  async me(@Ctx() ctx: ResolverContext): Promise<User | undefined | null> {
    const user = await User.findOne({ where: { id: ctx.req.session!.userId } });

    return user || null;
  }

  @Authorized(Role.ADMIN)
  @Query(() => [User])
  async getAllUsers(): Promise<User[] | undefined | []> {
    const user = await User.find();
    return user || [];
  }

  @Mutation(() => User, { nullable: true })
  async changePassword(
    @Arg('oldPassword') oldPassword: string,
    @Arg('newPassword') newPassword: string,
    @Ctx() ctx: ResolverContext
  ): Promise<User | null> {
    const user = await User.findOne({ where: { id: ctx.req.session!.userId } });

    if (!user) {
      return null;
    }

    if (!comparePasswords(oldPassword, user.password)) {
      return null;
    }

    user.password = hashPassword(newPassword);
    await user.save();

    return user;
  }

  @Mutation(() => User, { nullable: true })
  async updateProfile(
    @Arg('data') updateProfileData: UpdateProfileInput,
    @Ctx() ctx: ResolverContext
  ): Promise<User | null | Error> {
    const user: any = await User.findOne({ where: { id: ctx.req.session!.userId } });

    if (!user) {
      return null;
    }

    Object.keys(updateProfileData).forEach(key => {
      user[key] = updateProfileData[key];
    });

    await user.save().catch((e: Error) => {
      throw e;
    });
    return user;
  }
}
