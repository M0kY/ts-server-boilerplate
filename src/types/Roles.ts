import { registerEnumType } from 'type-graphql';

export enum Role {
  USER,
  ADMIN,
}

registerEnumType(Role, {
  name: 'Role',
  description: 'User roles',
});
