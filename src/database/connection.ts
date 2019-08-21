import { createConnection } from 'typeorm';

const databaseConnection = async () => {
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
};

export { databaseConnection };
