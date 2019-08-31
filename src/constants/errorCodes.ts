import { ApolloError } from 'apollo-server-core';
import { ErrorObjectArray, ErrorObject, ErrorCode } from '../types/Error';

export const ERROR_CORS_REQUEST_BLOCKED: string = 'ERROR_CORS_REQUEST_BLOCKED';
export const ERROR_INVALID_LOGIN: string = 'ERROR_INVALID_LOGIN';
export const ERROR_INVALID_TOKEN: string = 'ERROR_INVALID_TOKEN';
export const ERROR_USER_NOT_FOUND: string = 'ERROR_USER_NOT_FOUND';
export const ERROR_USER_ALREADY_ACTIVE: string = 'ERROR_USER_ALREADY_ACTIVE';
export const ERROR_USER_NOT_LOGGED_IN: string = 'ERROR_USER_NOT_LOGGED_IN';

export const ERRORS: ErrorObjectArray = {
  ERROR_CORS_REQUEST_BLOCKED: {
    code: ErrorCode.CORS_ERROR,
    key: ERROR_CORS_REQUEST_BLOCKED,
    message: 'Not allowed by CORS.',
  },
  ERROR_INVALID_LOGIN: {
    code: ErrorCode.AUTHENTICATION_ERROR,
    key: ERROR_INVALID_LOGIN,
    message: 'Invalid username or password.',
  },
  ERROR_INVALID_TOKEN: {
    code: ErrorCode.AUTHENTICATION_ERROR,
    key: ERROR_INVALID_TOKEN,
    message: 'Invalid token.',
  },
  ERROR_USER_NOT_FOUND: {
    code: ErrorCode.AUTHENTICATION_ERROR,
    key: ERROR_USER_NOT_FOUND,
    message: 'User not found.',
  },
  ERROR_USER_ALREADY_ACTIVE: {
    code: ErrorCode.FORBIDDEN_ERROR,
    key: ERROR_USER_ALREADY_ACTIVE,
    message: 'User already active.',
  },
  ERROR_USER_NOT_LOGGED_IN: {
    code: ErrorCode.AUTHENTICATION_ERROR,
    key: ERROR_USER_NOT_LOGGED_IN,
    message: 'Not logged in.',
  },
};

export class CustomError extends ApolloError {
  constructor({ message, code, key }: ErrorObject) {
    super(message, code, { key });

    Object.defineProperty(this, 'name', { value: 'CustomError' });
  }
}
