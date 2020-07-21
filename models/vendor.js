'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class vendor extends Model {
        static associate(models) {}
    };
    vendor.init({
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: sequelize.UUIDV4,
          },
          serial: {
            unique: true,
            type: DataTypes.INTEGER,
            autoIncrement: true,
          },
          name: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
          },
          data_json: {
            type: DataTypes.JSON
          }
    }, {
        sequelize,
        timestamps: false,
        modelName: 'vendor',
        tableName: 'vendor',
    });
    return vendor;
};