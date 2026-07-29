'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Version extends Model {
    static associate(models) {
      Version.belongsTo(models.Document, { foreignKey: 'documentId' });
    }
  }
  Version.init({
    snapshot: DataTypes.TEXT,
    label: DataTypes.STRING,
    documentId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Version',
  });
  return Version;
};