import { createConnection, Connection } from 'typeorm';

const databaseConnection = async (): Promise<Connection | undefined> => {
  let retries = 10;
  while (retries) {
    try {
      console.log('Connecting to DB...');
      const connection = await createConnection();
      console.log('Successfully connected to DB');
      return connection;
    } catch (error) {
      console.log(error);
      retries -= 1;
      console.log(`Connection to DB failed: ${retries} retries remaining...`);
      await new Promise(res => {
        setTimeout(res, 5000);
      });
    }
  }
  return undefined;
};

export { databaseConnection };
