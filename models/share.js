'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Share extends Model {
    static associate(models) {
      Share.belongsTo(models.Document, { foreignKey: 'documentId' });
    }
  }
  Share.init({
    slug: DataTypes.STRING,
    documentId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Share',
  });
  return Share;
};