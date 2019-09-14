import { Field, InputType, ArgsType } from 'type-graphql';
import { IsEmail, Length } from 'class-validator';
import { User } from '../modules/entity/User';

@InputType({ description: 'User profile data which can be updated' })
export class UpdateProfileInput implements Partial<User> {
  [key: string]: string;

  @Field({ nullable: true })
  @IsEmail()
  email: string;

  @Field({ nullable: true })
  firstName: string;

  @Field({ nullable: true })
  lastName: string;
}

@ArgsType()
export class LoginInput {
  @Field()
  username: string;

  @Field()
  @Length(8, 72)
  password: string;
}

@ArgsType()
export class RegisterInput extends LoginInput {
  @Field()
  @IsEmail()
  email: string;
}

export interface User2faDTO {
  enabled2fa?: boolean;
  secret2fa?: string | null;
}
