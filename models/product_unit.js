'use strict';
const {
    Model
} = require('sequelize');
const { Sequelize } = require('.');
module.exports = (sequelize, DataTypes) => {
    class product_unit extends Model {
        static associate(models) {}
    };
    product_unit.init({
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
        convert_factor: {
            type: DataTypes.FLOAT,
            allowNull: true
        },
        accuracy: { // Decimal points
            type: DataTypes.INTEGER,
        },
    }, {
        sequelize,
        timestamps: false,
        modelName: 'product_unit',
        tableName: 'product_unit',
    });
    return product_unit;
};