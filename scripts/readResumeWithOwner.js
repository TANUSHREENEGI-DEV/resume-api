const { sequelize, Resume } = require('../models');

async function run() {
  await sequelize.sync();
  const first = await Resume.findByPk(1, { include: require('../models').User });
  console.log('Resume "' + first.title + '" belongs to ' + first.User.name);
  process.exit();
}

run();