import { Service } from 'typedi';
import { User } from '../entity/User';
import { getRepository, Repository } from 'typeorm';
import { hashPassword } from '../../utils/crypto';
import { UpdateProfileInput, RegisterInput } from '../../types/ResolverTypes';
import {
  CustomError,
  getErrorByKey,
  ERROR_WHILE_UPDATING_USER,
  ERROR_USER_NOT_FOUND,
  ERROR_WHILE_CREATING_USER,
} from '../../constants/errorCodes';

@Service()
export class UserService {
  private readonly userRepository: Repository<User> = getRepository(User);

  async findById(id: string) {
    const user = await this.userRepository.findOne({ id: parseInt(id, 10) });
    if (!user) {
      throw new CustomError(getErrorByKey(ERROR_USER_NOT_FOUND));
    }
    return user;
  }

  async findByUsernameOrEmail(username: string) {
    return await this.userRepository.findOne({
      where: [{ username: username.toLowerCase() }, { email: username.toLowerCase() }],
    });
  }

  async findByEmail(email: string) {
    return await this.userRepository.findOne({ email });
  }

  async getAll() {
    return await this.userRepository.find();
  }

  async createUser(data: RegisterInput) {
    let user = new User();

    user.username = data.username.toLowerCase();
    user.displayName = data.username;
    user.email = data.email.toLowerCase();
    user.password = hashPassword(data.password);

    return this.userRepository.save(user).catch((_: Error) => {
      throw new CustomError(getErrorByKey(ERROR_WHILE_CREATING_USER));
    });
  }

  async updatePassword(user: User, newPassword: string) {
    user.password = hashPassword(newPassword);
    await this.userRepository.save(user).catch((_: Error) => {
      throw new CustomError(getErrorByKey(ERROR_WHILE_UPDATING_USER));
    });
  }

  async updateUserProfile(id: string, updateProfileData: UpdateProfileInput) {
    const user: any = await this.findById(id);

    Object.keys(updateProfileData).forEach(key => {
      if (updateProfileData[key]) {
        user[key] = updateProfileData[key];
      }
    });

    return this.userRepository.save(user).catch((_: Error) => {
      throw new CustomError(getErrorByKey(ERROR_WHILE_UPDATING_USER));
    });
  }

  async updateUser(id: string, data: Partial<User>) {
    return this.userRepository.update(id, data).catch((_: Error) => {
      throw new CustomError(getErrorByKey(ERROR_WHILE_UPDATING_USER));
    });
  }
}
