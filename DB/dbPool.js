const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: "localhost",
  port: "3306",
  user: "root",
  password: "123456789",
  database: "excelDB",
  connectionLimit: 10,
});

module.exports = pool;
