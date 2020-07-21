'use strict';
const { Model} = require('sequelize');
const { Sequelize } = require('.');
module.exports = (sequelize, DataTypes) => {
    class seller extends Model {
        static associate(models) {}
    };
    seller.init({
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
        modelName: 'seller',
        tableName: 'seller',
    });
    return seller;
};