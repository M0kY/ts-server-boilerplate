import 'reflect-metadata';
import 'dotenv/config';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import session from 'express-session';
import connectRedis from 'connect-redis';
import express, { Request, Response, NextFunction } from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema, ArgumentValidationError } from 'type-graphql';
import { Container } from 'typedi';

import { databaseConnection } from './database/connection';
import { SERVER_PORT, GRAPHQL_ENDPOINT, SESSION_SECRET, NODE_ENV, SESSION_COOKIE_NAME } from './config/envConfig';
import { corsOptions } from './middleware/corsMiddleware';
import { redis } from './config/redis';
import { USER_SESSION_PREFIX } from './constants/redisPrefixes';
import { authChecker } from './middleware/authChecker';
import { ERROR_CORS_REQUEST_BLOCKED, ERRORS } from './constants/errorCodes';
import { ErrorCode } from './types/Error';
import { logger } from './utils/logger';

const app = express();

(async () => {
  await databaseConnection();

  const schema = await buildSchema({
    resolvers: [__dirname + '/modules/resolvers/!(*.test).?(ts|js)'],
    validate: { validationError: { target: false, value: false } },
    authChecker,
    container: Container,
  });

  const server = new ApolloServer({
    schema,
    context: ({ req, res }) => ({
      session: req ? req.session : undefined,
      req,
      res,
    }),
    formatError: error => {
      if (error.originalError instanceof ArgumentValidationError) {
        return {
          code: ErrorCode.USER_INPUT_ERROR,
          message: error.message,
          path: error.path,
          validationErrors: error.extensions!.exception.validationErrors,
        };
      }
      return {
        code: error.extensions!.code,
        key: error.extensions!.exception.key,
        message: error.message,
        path: error.path,
      };
    },
  });

  app.use(helmet());
  app.use(compression());
  app.use(cors(corsOptions));

  app.use(GRAPHQL_ENDPOINT, (err: any, _: Request, res: Response, next: NextFunction) => {
    if (err.name === ERROR_CORS_REQUEST_BLOCKED) {
      res.status(200).send({
        errors: [JSON.parse(JSON.stringify({ ...ERRORS.ERROR_CORS_REQUEST_BLOCKED }))],
      });
      return;
    }
    next();
  });

  const RedisStore = connectRedis(session);
  app.use(
    session({
      store: new RedisStore({
        client: redis,
        prefix: USER_SESSION_PREFIX,
      }),
      name: SESSION_COOKIE_NAME,
      secret: SESSION_SECRET,
      resave: false,
      rolling: true,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: NODE_ENV === 'production',
        maxAge: 1000 * 60 * 15, // 15min
      },
    })
  );

  server.applyMiddleware({ app, path: GRAPHQL_ENDPOINT });

  app.listen({ port: SERVER_PORT }, () =>
    logger.info(`Server is running on http://localhost:4000${server.graphqlPath}`)
  );
})();
