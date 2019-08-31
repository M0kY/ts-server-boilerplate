export enum ErrorCode {
  DATABASE_ERROR = 'DATABASE_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  FORBIDDEN_ERROR = 'FORBIDDEN_ERROR',
  CORS_ERROR = 'CORS_ERROR',
}

export interface ErrorObject {
  code: ErrorCode;
  key: string;
  message: string;
}

export interface ErrorObjectArray {
  [key: string]: ErrorObject;
}
