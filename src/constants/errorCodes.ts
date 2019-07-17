export const ERROR_CORS_REQUEST_BLOCKED: string = 'ERROR_CORS_REQUEST_BLOCKED';

interface ErrorsObject {
  [key: string]: {
    code: number;
    message: string;
  };
}

export const ERRORS: ErrorsObject = {
  ERROR_CORS_REQUEST_BLOCKED: {
    code: 401,
    message: 'Not allowed by CORS.',
  },
};
