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
  ERROR_WHILE_LOOKING_FOR_USER,
} from '../../constants/errorCodes';
import { logger } from '../../utils/logger';

@Service()
export class UserService {
  private readonly userRepository: Repository<User> = getRepository(User);

  async findById(id: string) {
    const user = await this.userRepository.findOne({ id: parseInt(id, 10) }).catch((error: Error) => {
      logger.error(error);
      throw new CustomError(getErrorByKey(ERROR_WHILE_LOOKING_FOR_USER));
    });

    if (!user) {
      throw new CustomError(getErrorByKey(ERROR_USER_NOT_FOUND));
    }
    return user;
  }

  async findByUsernameOrEmail(username: string) {
    return await this.userRepository
      .findOne({
        where: [{ username: username.toLowerCase() }, { email: username.toLowerCase() }],
      })
      .catch((error: Error) => {
        logger.error(error);
        throw new CustomError(getErrorByKey(ERROR_WHILE_LOOKING_FOR_USER));
      });
  }

  async findByEmail(email: string) {
    return await this.userRepository.findOne({ email }).catch((error: Error) => {
      logger.error(error);
      throw new CustomError(getErrorByKey(ERROR_WHILE_LOOKING_FOR_USER));
    });
  }

  async getAll() {
    return await this.userRepository.find().catch((error: Error) => {
      logger.error(error);
      throw new CustomError(getErrorByKey(ERROR_WHILE_LOOKING_FOR_USER));
    });
  }

  async createUser(data: RegisterInput) {
    const user = new User();

    user.username = data.username.toLowerCase();
    user.displayName = data.username;
    user.email = data.email.toLowerCase();
    user.password = hashPassword(data.password);

    return this.userRepository.save(user).catch((error: Error) => {
      logger.error(error);
      throw new CustomError(getErrorByKey(ERROR_WHILE_CREATING_USER));
    });
  }

  async updatePassword(user: User, newPassword: string) {
    user.password = hashPassword(newPassword);
    await this.userRepository.save(user).catch((error: Error) => {
      logger.error(error);
      throw new CustomError(getErrorByKey(ERROR_WHILE_UPDATING_USER));
    });
  }

  async updateUserProfile(id: string, updateProfileData: UpdateProfileInput) {
    const user: any = await this.findById(id).catch((error: Error) => {
      logger.error(error);
      throw new CustomError(getErrorByKey(ERROR_WHILE_LOOKING_FOR_USER));
    });

    Object.keys(updateProfileData).forEach(key => {
      if (updateProfileData[key] !== undefined) {
        user[key] = updateProfileData[key];
      }
    });

    return this.userRepository.save(user).catch((error: Error) => {
      logger.error(error);
      throw new CustomError(getErrorByKey(ERROR_WHILE_UPDATING_USER));
    });
  }

  async updateUser(id: string, data: Partial<User>) {
    return this.userRepository.update(id, data).catch((error: Error) => {
      logger.error(error);
      throw new CustomError(getErrorByKey(ERROR_WHILE_UPDATING_USER));
    });
  }

  async failedLoginAttempt(user: User) {
    user.loginAttempts++;
    if (user.loginAttempts >= 10) {
      user.locked = true;
    }

    await this.userRepository.save(user).catch((error: Error) => {
      logger.error(error);
      throw new CustomError(getErrorByKey(ERROR_WHILE_UPDATING_USER));
    });
  }

  async resetLoginAttempts(id: number) {
    return this.userRepository.update(id, { loginAttempts: 0 }).catch((error: Error) => {
      logger.error(error);
      throw new CustomError(getErrorByKey(ERROR_WHILE_UPDATING_USER));
    });
  }
}
