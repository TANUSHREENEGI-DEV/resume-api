const sequelize = require('../config/database');
const User = require('./user');
const Resume = require('./resume');

const models = { User, Resume };

Object.values(models).forEach(function (model) {
  if (model.associate) model.associate(models);
});

module.exports = { sequelize, ...models };