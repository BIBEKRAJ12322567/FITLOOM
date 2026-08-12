const app = require('./app');
const connectDB = require('./config/db');
const config = require('./config/env');

async function start() {
  await connectDB();
  app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on port ${config.port}`);
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server:', err);
  process.exit(1);
});
