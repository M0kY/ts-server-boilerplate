export const NODE_ENV = process.env.NODE_ENV;
export const SERVER_PORT = process.env.SERVER_PORT || 4000;
export const GRAPHQL_ENDPOINT = process.env.GRAPHQL_ENDPOINT || '/graphql';
export const SESSION_SECRET = process.env.SESSION_SECRET || 'rxESeBenb5EmxxCZjyWpWD5MXMSA35H9';
export const REDIS_HOST = process.env.REDIS_HOST || '';
export const REDIS_PASSWORD = process.env.REDIS_PASSWORD || '2JJXKkPAP37bxsCje6Xk56wUjub32FG2';
export const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS!, 10) || 12;
export const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'sid';
