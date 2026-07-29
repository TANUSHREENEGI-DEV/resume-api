const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  'resume_db',
  'root',
  process.env.DB_PASSWORD,
  {
    host: 'localhost',
    dialect: 'mysql',
    logging: false,
  }
);

module.exports = sequelize;