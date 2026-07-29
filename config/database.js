const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  'resume_db',
  'root',
  'TANUSHREE@5678!',
  {
    host: 'localhost',
    dialect: 'mysql',
    logging: false,
  }
);

module.exports = sequelize;