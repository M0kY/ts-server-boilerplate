import { Resolver, Query, Mutation, Field, Ctx, Authorized, InputType, Arg, ID, ObjectType } from 'type-graphql';
import { User } from '../entity/User';
import { ResolverContext } from '../../types/ResolverContext';
import { hashPassword, comparePasswords } from '../../utils/crypto';
import { Role } from '../../types/Roles';
import { AuthenticationError, UserInputError, ApolloError } from 'apollo-server-errors';

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

@Resolver(User)
export class UserResolver {
  @Authorized()
  @Query(() => User, { nullable: true })
  async me(@Ctx() ctx: ResolverContext): Promise<User> {
    const user = await User.findOne({ where: { id: ctx.req.session!.userId } });

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    return user;
  }

  @Authorized(Role.ADMIN)
  @Query(() => [User])
  async getAllUsers(): Promise<User[]> {
    const user = await User.find();
    return user || [];
  }

  @Mutation(() => ChangePasswordData, { nullable: true })
  async changePassword(
    @Arg('currentPassword') currentPassword: string,
    @Arg('newPassword') newPassword: string,
    @Ctx() ctx: ResolverContext
  ): Promise<ChangePasswordData> {
    const user = await User.findOne({ where: { id: ctx.req.session!.userId } });

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    if (!comparePasswords(currentPassword, user.password)) {
      throw new UserInputError('Incorrect current password value.', {
        invalidArgument: 'currentPassword',
      });
    }

    user.password = hashPassword(newPassword);
    await user.save();

    return { id: user.id.toString(), passwordChanged: true };
  }

  @Mutation(() => User, { nullable: true })
  async updateProfile(@Arg('data') updateProfileData: UpdateProfileInput, @Ctx() ctx: ResolverContext): Promise<User> {
    const user: any = await User.findOne({ where: { id: ctx.req.session!.userId } });

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    Object.keys(updateProfileData).forEach(key => {
      user[key] = updateProfileData[key];
    });

    await user.save().catch((e: Error) => {
      throw new ApolloError(e.message, 'ERROR_WHILE_UPDATING_USER');
    });
    return user;
  }
}
