'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class product extends Model {
        static associate(models) {}
    };
    product.init({
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
        warningZone: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        code: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
        },
    }, {
        sequelize,
        timestamps: false,
        modelName: 'product',
        tableName: 'product',
    });
    return product;
};