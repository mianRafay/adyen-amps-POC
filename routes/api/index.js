/**
 * @author: Abdur Rafay
 * @description: All the routes will be imported in this file
 *
 */
const express = require("express");
const router = express.Router();
router.use("", require("./order"));
module.exports = router;
