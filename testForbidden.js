const { sequelize, User } = require('./models');

async function run() {
  await sequelize.sync();
  await User.create({
    name: 'Duplicate Test',
    email: 'tanushree20@gmail.com',
    password: 'secret123',
  });
  process.exit();
}

run();