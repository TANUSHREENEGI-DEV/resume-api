const { sequelize, Resume } = require('../models');

async function run() {
  await sequelize.sync();
  const first = await Resume.findByPk(1);
  first.title = 'Full Stack Developer Intern';
  await first.save();
  console.log('Updated title:', first.title);
  process.exit();
}

run();