'use strict';
const { Model } = require('sequelize');
const { Sequelize } = require('.');
module.exports = (sequelize, DataTypes) => {
    class product_type extends Model {
        static associate(models) {}
    };
    product_type.init({
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: sequelize.UUIDV4,
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
        modelName: 'product_type',
        tableName: 'product_type',
    });
    return product_type;
};