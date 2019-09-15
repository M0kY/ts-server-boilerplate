import { createConnection, Connection } from 'typeorm';
import { logger } from '../utils/logger';

const databaseConnection = async (): Promise<Connection | undefined> => {
  let retries = 10;
  while (retries) {
    try {
      logger.info('Connecting to DB...');
      const connection = await createConnection();
      logger.info('Successfully connected to DB');
      return connection;
    } catch (error) {
      logger.error(error);
      retries -= 1;
      logger.error(`Connection to DB failed: ${retries} retries remaining...`);
      await new Promise(res => {
        setTimeout(res, 5000);
      });
    }
  }
  return undefined;
};

export { databaseConnection };
