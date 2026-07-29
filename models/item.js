'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Item extends Model {     static associate(models) {
  Item.belongsTo(models.Section, { foreignKey: 'sectionId' });
}
  }
  Item.init({
    content: DataTypes.TEXT,
    position: DataTypes.INTEGER,
    sectionId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Item',
  });
  return Item;
};