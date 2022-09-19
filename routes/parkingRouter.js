const express = require("express");
const router = express.Router();
const pool = require("../DB/dbPool");

router.get("/");

module.exports = router;
