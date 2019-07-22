import { ObjectType, Field, ID } from 'type-graphql';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  Unique,
  UpdateDateColumn,
  CreateDateColumn,
} from 'typeorm';
import { Role } from '../../types/Roles';

@ObjectType()
@Entity()
@Unique(['username', 'email'])
export class User extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn({ type: 'integer' })
  id: number;

  @Field()
  @Column()
  username: string;

  @Field()
  @Column()
  displayName: string;

  @Column()
  password: string;

  @Field()
  @Column({ unique: true })
  email: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  firstName: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  lastName: string;

  @Field(() => Role)
  @Column({ default: Role.USER })
  role: Role;

  @Field()
  @Column({ default: false })
  activated: boolean;

  @Field()
  @Column({ default: false })
  locked: boolean;

  @Field(() => Date)
  @CreateDateColumn()
  createdAt: string;

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt: string;
}
