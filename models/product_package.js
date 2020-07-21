'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class product_package extends Model {
        static associate(models) {}
    };
    product_package.init({
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: sequelize.UUIDV4,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
          convert_factor: {
            type: DataTypes.FLOAT,
            allowNull: true
        }, 
    }, {
        sequelize,
        timestamps: false,
        modelName: 'product_package',
        tableName: 'product_package',
    });
    return product_package;
};