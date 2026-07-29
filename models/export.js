'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Export extends Model {
    static associate(models) {
      Export.belongsTo(models.Document, { foreignKey: 'documentId' });
      Export.belongsTo(models.User, { foreignKey: 'userId' });
    }
  }
  Export.init({
    format: DataTypes.ENUM('pdf', 'docx'),
    fileUrl: DataTypes.STRING,
    documentId: DataTypes.INTEGER,
    userId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Export',
  });
  return Export;
};