import 'reflect-metadata';
import 'dotenv/config';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import session from 'express-session';
import connectRedis from 'connect-redis';
import { GraphQLServer, Options } from 'graphql-yoga';
import { buildSchema } from 'type-graphql';
import { createConnection } from 'typeorm';

import { SERVER_PORT, GRAPHQL_ENDPOINT, SESSION_SECRET, NODE_ENV, SESSION_COOKIE_NAME } from './config/envConfig';
import { corsOptions } from './middleware/corsMiddleware';
import { redis } from './config/redis';
import { USER_SESSION_PREFIX } from './constants/redisPrefixes';
import { authChecker } from './middleware/authChecker';

(async () => {
  let retries = 10;
  while (retries) {
    try {
      console.log('Connecting to DB...');
      await createConnection();
      console.log('Successfully connected to DB');
      break;
    } catch (error) {
      console.log(error);
      retries -= 1;
      console.log(`Connection to DB failed: ${retries} retries remaining...`);
      await new Promise(res => {
        setTimeout(res, 5000);
      });
    }
  }

  const schema = await buildSchema({
    resolvers: [__dirname + '/modules/resolvers/!(*.test).?(ts|js)'],
    validate: false,
    authChecker,
  });

  const server = new GraphQLServer({
    schema,
    context: ({ request, response }) => ({
      session: request ? request.session : undefined,
      req: request,
      res: response,
    }),
  });

  server.express.use(compression());
  server.express.use(helmet());
  server.express.disable('x-powered-by');
  server.express.use(cors(corsOptions));

  const RedisStore = connectRedis(session);
  server.express.use(
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

  const options: Options = {
    port: SERVER_PORT,
    endpoint: GRAPHQL_ENDPOINT,
    playground: GRAPHQL_ENDPOINT,
  };

  server.start(options, ({ port }) => console.log(`Server is running on port ${port}.`));
})();
