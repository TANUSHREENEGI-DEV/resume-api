const { sequelize } = require('../models');

async function run() {
  await sequelize.sync();
  console.log('tables synced');
  process.exit();
}

run();