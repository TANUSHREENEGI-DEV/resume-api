'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Document extends Model {
    static associate(models) {
      Document.belongsTo(models.User, { foreignKey: 'userId' });
      Document.belongsTo(models.Template, { foreignKey: 'templateId' });
      Document.hasMany(models.Section, { foreignKey: 'documentId', onDelete: 'CASCADE' });
      Document.hasMany(models.Version, { foreignKey: 'documentId', onDelete: 'CASCADE' });
      Document.hasMany(models.Application, { foreignKey: 'documentId', onDelete: 'CASCADE' });
      Document.hasMany(models.Share, { foreignKey: 'documentId', onDelete: 'CASCADE' });
      Document.hasMany(models.Export, { foreignKey: 'documentId', onDelete: 'CASCADE' });
    }
  }
  Document.init({
    title: DataTypes.STRING,
    type: DataTypes.ENUM('resume', 'cover_letter'),
    userId: DataTypes.INTEGER,
    templateId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Document',
  });
  return Document;
};