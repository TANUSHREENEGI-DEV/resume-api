const { sequelize, User } = require('../models');

async function run() {
  await sequelize.sync();
  const user = await User.create({
    name: 'Tanushree Negi',
    email: 'tanushree20@gmail.com',
    password: 'secret123',
  });
  console.log('Saved user #' + user.id);
  process.exit();
}

run();