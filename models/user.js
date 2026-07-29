const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
  password: { type: DataTypes.STRING, allowNull: false },
});

User.beforeCreate(async function (user) {
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
});

User.prototype.checkPassword = function (plainText) {
  return bcrypt.compare(plainText, this.password);
};

User.associate = function (models) {
  User.hasMany(models.Resume, { foreignKey: 'userId', onDelete: 'CASCADE' });
};

module.exports = User;