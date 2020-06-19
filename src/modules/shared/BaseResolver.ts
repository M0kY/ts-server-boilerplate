// import { ClassType, Resolver, Query, Arg, Mutation } from 'type-graphql';
// import { BaseEntity } from 'typeorm';

// export function createBaseResolver<
//   T extends ClassType,
//   X extends ClassType,
//   I extends typeof BaseEntity & { new (...args: any[]): any }
// >(suffix: string, inputType: T, returnType: X, entity: I) {
//   @Resolver({ isAbstract: true })
//   abstract class BaseResolver {
//     @Query(() => [returnType], { name: `getAll${suffix}` })
//     async getAll(): Promise<T[] | undefined | []> {
//       return await entity.find();
//     }

//     @Mutation(() => returnType, { name: `create${suffix}` })
//     async create(@Arg('data', () => inputType) data: any): Promise<T> {
//       return await entity.create(data).save();
//     }
//   }

//   return BaseResolver;
// }
