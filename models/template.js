'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Template extends Model {
        static associate(models) {
      Template.hasMany(models.Document, { foreignKey: 'templateId' });
    }
  }
  Template.init({
    name: DataTypes.STRING,
    config: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Template',
  });
  return Template;
};