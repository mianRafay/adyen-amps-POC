/**
 *
 * Author:  Abdur Rafay
 *
 */

const uuid = require("uuid").v4;
("use strict");
module.exports = (sequelize, DataTypes) => {
  let ApiKey = sequelize.define(
    "api_key",
    {
      id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: () => uuid(),
      },
      user_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      key: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      is_active: {
        type: DataTypes.ENUM("Y", "N"),
        allowNull: false,
        defaultValue: () => "N",
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        onUpdate: DataTypes.NOW,
        field: "updated_at",
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: "created_at",
      },
    },

    {
      indexes: [
        {
          unique: true,
          fields: ["id"],
        },
      ],
      timestamps: true,
    }
  );
  return ApiKey;
};
