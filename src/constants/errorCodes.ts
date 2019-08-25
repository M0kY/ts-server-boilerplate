export const ERROR_CORS_REQUEST_BLOCKED: string = 'ERROR_CORS_REQUEST_BLOCKED';

interface ErrorsObject {
  [key: string]: {
    code: string;
    message: string;
    status: number;
  };
}

export const ERRORS: ErrorsObject = {
  ERROR_CORS_REQUEST_BLOCKED: {
    code: ERROR_CORS_REQUEST_BLOCKED,
    message: 'Not allowed by CORS.',
    status: 401,
  },
};
