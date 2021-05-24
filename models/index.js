/**
 *
 * Author: Mian Abdur Rafay
 * Desc: file to have all the sequlize connection related information
 * and import of all the models declared in this folder
 */

"use strict";

const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const basename = path.basename(__filename);
const db = {};

let newConfig = {
  username: "root",
  password: "R00tonE23",
  dialect: "mysql",
  host: "db-stampen.c9bn4vxywq3w.eu-west-2.rds.amazonaws.com",
  database: "stampen_adyen",
  operatorsAliases: "0",
  logging: true,
  pool: {
    max: 5,
    min: 0,
    acquire: 100000,
    idle: 10000,
  },
};
let sequelize;
sequelize = new Sequelize(newConfig.database, newConfig.username, newConfig.password, newConfig);

fs.readdirSync(__dirname)
  .filter((file) => {
    return file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js";
  })
  .forEach((file) => {
    const model = sequelize["import"](path.join(__dirname, file));
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
