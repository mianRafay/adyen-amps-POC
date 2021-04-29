/**
 *
 * Author:  AppSeed.us
 *
 * License: MIT - Copyright (c) AppSeed.us
 * @link https://github.com/app-generator/nodejs-starter
 *
 */

("use strict");

const uuid = require("uuid").v4;

module.exports = (sequelize, DataTypes) => {
  let Order = sequelize.define("order", {
    id: {
      allowNull: false,
      primaryKey: true,
      type: DataTypes.UUID,
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: () => uuid(),
    },
    ariaAccountID: DataTypes.STRING,
    ariaBillingGroupID: DataTypes.STRING,
    orderDetails: DataTypes.TEXT("long"),
    orderStatus: DataTypes.STRING,
    orderFailureModule: DataTypes.STRING,
    orderFailureReason: DataTypes.STRING,
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      onUpdate: DataTypes.NOW,
    },
  });

  return Order;
};
