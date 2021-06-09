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
    ariaAccountNo: DataTypes.STRING,
    ariaAccountNo: DataTypes.STRING,
    ariaBillingGroupID: DataTypes.STRING,
    ariaMPINo: DataTypes.STRING,
    ariaMPIID: DataTypes.STRING,
    orderDetails: DataTypes.TEXT("long"),
    orderStatus: DataTypes.STRING,
    orderFailureModule: DataTypes.STRING,
    orderFailureReason: DataTypes.STRING,
    resultCode: DataTypes.STRING,
    resultText: DataTypes.TEXT("long"),
    isDeleted: {
      type: DataTypes.ENUM("Y", "N"),
      allowNull: false,
      defaultValue: () => "N",
    },
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
