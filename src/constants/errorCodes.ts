import { ApolloError } from 'apollo-server-core';
import { ErrorsObject, ErrorCode, CustomErrorDTO } from '../types/Error';

export const ERROR_CORS_REQUEST_BLOCKED = 'ERROR_CORS_REQUEST_BLOCKED';
export const ERROR_INVALID_LOGIN = 'ERROR_INVALID_LOGIN';
export const ERROR_INVALID_TOKEN = 'ERROR_INVALID_TOKEN';
export const ERROR_USER_NOT_FOUND = 'ERROR_USER_NOT_FOUND';
export const ERROR_USER_ALREADY_ACTIVE = 'ERROR_USER_ALREADY_ACTIVE';
export const ERROR_USER_NOT_ACTIVE = 'ERROR_USER_NOT_ACTIVE';
export const ERROR_USER_NOT_LOGGED_IN = 'ERROR_USER_NOT_LOGGED_IN';
export const ERROR_WHILE_LOOKING_FOR_USER = 'ERROR_WHILE_LOOKING_FOR_USER';
export const ERROR_WHILE_CREATING_USER = 'ERROR_WHILE_CREATING_USER';
export const ERROR_WHILE_UPDATING_USER = 'ERROR_WHILE_UPDATING_USER';
export const ERROR_WHILE_REDIS_SET = 'ERROR_WHILE_REDIS_SET';
export const ERROR_WHILE_REDIS_LOOKUP = 'ERROR_WHILE_REDIS_LOOKUP';
export const ERROR_WHILE_REDIS_DELETE = 'ERROR_WHILE_REDIS_DELETE';
export const ERROR_WHILE_SENDING_EMAIL = 'ERROR_WHILE_SENDING_EMAIL';
export const ERROR_INVALID_PASSWORD_INPUT = 'ERROR_INVALID_PASSWORD_INPUT';
export const ERROR_INVALID_2FA_TOKEN = 'ERROR_INVALID_2FA_TOKEN';
export const ERROR_NO_2FA_SECRET = 'ERROR_NO_2FA_SECRET';
export const ERROR_2FA_ALREADY_VERIFIED = 'ERROR_2FA_ALREADY_VERIFIED';
export const ERROR_2FA_NOT_ACTIVE = 'ERROR_2FA_NOT_ACTIVE';
export const ERROR_2FA_TOKEN_REQUIRED = 'ERROR_2FA_TOKEN_REQUIRED';
export const ERROR_UNKNOWN = 'ERROR_UNKNOWN';

export const ERRORS: ErrorsObject = {
  ERROR_CORS_REQUEST_BLOCKED: {
    code: ErrorCode.CORS_ERROR,
    message: 'Not allowed by CORS.',
  },
  ERROR_INVALID_LOGIN: {
    code: ErrorCode.AUTHENTICATION_ERROR,
    message: 'Invalid username or password.',
  },
  ERROR_INVALID_TOKEN: {
    code: ErrorCode.AUTHENTICATION_ERROR,
    message: 'Invalid token.',
  },
  ERROR_USER_NOT_FOUND: {
    code: ErrorCode.AUTHENTICATION_ERROR,
    message: 'User not found.',
  },
  ERROR_USER_ALREADY_ACTIVE: {
    code: ErrorCode.FORBIDDEN_ERROR,
    message: 'User already active.',
  },
  ERROR_USER_NOT_ACTIVE: {
    code: ErrorCode.FORBIDDEN_ERROR,
    message: 'User not active.',
  },
  ERROR_USER_NOT_LOGGED_IN: {
    code: ErrorCode.AUTHENTICATION_ERROR,
    message: 'Not logged in.',
  },
  ERROR_WHILE_LOOKING_FOR_USER: {
    code: ErrorCode.DATABASE_ERROR,
    message: 'An error occured while looking for user.',
  },
  ERROR_WHILE_UPDATING_USER: {
    code: ErrorCode.DATABASE_ERROR,
    message: 'An error occured while updating user.',
  },
  ERROR_WHILE_CREATING_USER: {
    code: ErrorCode.DATABASE_ERROR,
    message: 'An error occured while creating user.',
  },
  ERROR_WHILE_REDIS_SET: {
    code: ErrorCode.DATABASE_ERROR,
    message: 'An error occured while setting redis record.',
  },
  ERROR_WHILE_REDIS_LOOKUP: {
    code: ErrorCode.DATABASE_ERROR,
    message: 'An error occured while looking for redis record.',
  },
  ERROR_WHILE_REDIS_DELETE: {
    code: ErrorCode.DATABASE_ERROR,
    message: 'An error occured while deleting redis record.',
  },
  ERROR_WHILE_SENDING_EMAIL: {
    code: ErrorCode.INTERNAL_SERVER_ERROR,
    message: 'An error occured while sending email.',
  },
  ERROR_UNKNOWN: {
    code: ErrorCode.INTERNAL_SERVER_ERROR,
    message: 'Internal server error.',
  },
  ERROR_INVALID_PASSWORD_INPUT: {
    code: ErrorCode.USER_INPUT_ERROR,
    message: 'Incorrect current password value.',
  },
  ERROR_INVALID_2FA_TOKEN: {
    code: ErrorCode.AUTHENTICATION_ERROR,
    message: 'Invalid 2FA token.',
  },
  ERROR_NO_2FA_SECRET: {
    code: ErrorCode.FORBIDDEN_ERROR,
    message: 'The secret for 2FA is not set.',
  },
  ERROR_2FA_ALREADY_VERIFIED: {
    code: ErrorCode.FORBIDDEN_ERROR,
    message: 'Already verified 2FA.',
  },
  ERROR_2FA_NOT_ACTIVE: {
    code: ErrorCode.FORBIDDEN_ERROR,
    message: "Can't disable 2FA while it's not active.",
  },
  ERROR_2FA_TOKEN_REQUIRED: {
    code: ErrorCode.USER_INPUT_ERROR,
    message: 'Token for 2FA is required.',
  },
};

export class CustomError extends ApolloError {
  constructor({ message, code, key, properties }: CustomErrorDTO) {
    super(message, code, { key, ...properties });

    Object.defineProperty(this, 'name', { value: 'CustomError' });
  }
}

export const getErrorByKey = (key: string): CustomErrorDTO => {
  let lookingForError = key;
  if (typeof ERRORS[lookingForError] === 'undefined') {
    lookingForError = ERROR_UNKNOWN;
  }

  const errorObject = {
    ...ERRORS[lookingForError],
    key: lookingForError,
  };

  return errorObject;
};
