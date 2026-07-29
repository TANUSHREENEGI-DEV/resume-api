'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Section extends Model {
      static associate(models) {
  Section.belongsTo(models.Document, { foreignKey: 'documentId' });
  Section.hasMany(models.Item, { foreignKey: 'sectionId', onDelete: 'CASCADE' });
}
  }
  Section.init({
    heading: DataTypes.STRING,
    position: DataTypes.INTEGER,
    documentId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Section',
  });
  return Section;
};