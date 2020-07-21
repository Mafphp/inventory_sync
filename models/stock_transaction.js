'use strict';
const { Model } = require('sequelize');
const { Sequelize } = require('.');
module.exports = (sequelize, DataTypes) => {
  class stock_transaction extends Model {
    static associate(models) {
    }
  };
  stock_transaction.init({
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: sequelize.UUIDV4,
    },
    entity_ext_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    product_package_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    date_time: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: null
    }
  }, {
    sequelize,
    timestamps: false,
    modelName: 'stock_transaction',
    tableName: 'stock_transaction',
  });
  return stock_transaction;
};