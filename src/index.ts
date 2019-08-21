import 'reflect-metadata';
import 'dotenv/config';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import session from 'express-session';
import connectRedis from 'connect-redis';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';

import { databaseConnection } from './database/connection';
import { SERVER_PORT, GRAPHQL_ENDPOINT, SESSION_SECRET, NODE_ENV, SESSION_COOKIE_NAME } from './config/envConfig';
import { corsOptions } from './middleware/corsMiddleware';
import { redis } from './config/redis';
import { USER_SESSION_PREFIX } from './constants/redisPrefixes';
import { authChecker } from './middleware/authChecker';

const app = express();

(async () => {
  await databaseConnection();

  const schema = await buildSchema({
    resolvers: [__dirname + '/modules/resolvers/!(*.test).?(ts|js)'],
    validate: false,
    authChecker,
  });

  const server = new ApolloServer({
    schema,
    context: ({ req, res }) => ({
      session: req ? req.session : undefined,
      req,
      res,
    }),
  });

  app.use(helmet());
  app.use(compression());
  app.use(cors(corsOptions));

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
    console.log(`Server is running on http://localhost:4000${server.graphqlPath}.`)
  );
})();
