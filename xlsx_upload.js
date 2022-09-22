// const multer = require("multer");
// const path = require("path");
// const xlsx = require("xlsx");

// const pool = require("./DB/dbPool");
// const express = require("express");
// const router = express.Router();
// const app = express();
// const port = 3000; // 서버 포트번호

// app.use(
//   express.json({
//     limit: "50mb",
//   })
// );

// app.listen(port, () => {
//   console.log(`Running Server. http://localhost:${port}`);
// });

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "uploads/");
//   },
//   filename: function (req, file, cb) {
//     cb(null, new Date().valueOf() + path.extname(file.originalname));
//   },
// });

// const upload = multer({ storage: storage });

// app.post("/upload/excel", upload.single("xlsx"), async (req, res, next) => {
//   const workbook = xlsx.readFile(`./uploads/${req.file.filename}`);
//   const firstSheetName = workbook.Sheets[0];
//   const firstSheet = workbook.Sheets[firstSheetName];

//   console.log("firstSheetName: " + firstSheetName);
//   console.log(JSON.stringify(firstSheet, null, 2));

//   const firstSheetJson = xlsx.utils.sheet_to_json(firstSheet);
//   firstSheetJson.forEach(async (customer) => {
//     await pool.query(`INSERT INTO customer(name, email, phone, address)`)
//   })

//   res.send("OK");
// });

const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyparser = require("body-parser");
const readXlsxFile = require("read-excel-file/node");
const mysql = require("mysql2");
const multer = require("multer");
const app = express();
app.use(express.static("./public"));
app.use(bodyparser.json());
app.use(
  bodyparser.urlencoded({
    extended: true,
  })
);
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "1234",
  database: "dev",
});
db.connect(function (err) {
  if (err) {
    return console.error("error: " + err.message);
  }
  console.log("Database connected.");
});
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, __dirname + "/uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "-" + Date.now() + "-" + file.originalname);
  },
});
const uploadFile = multer({ storage: storage });
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});
app.post("/import-excel", uploadFile.single("import-excel"), (req, res) => {
  importFileToDb(__dirname + "/uploads/" + req.file.filename);
  console.log(res);
});
function importFileToDb(exFile) {
  readXlsxFile(exFile).then((rows) => {
    rows.shift();
    database.connect((error) => {
      if (error) {
        console.error(error);
      } else {
        let query =
          "INSERT INTO customer (name, email, phone, address) VALUES ?";
        connection.query(query, [rows], (error, response) => {
          console.log(error || response);
        });
      }
    });
  });
}
let nodeServer = app.listen(4000, function () {
  let port = nodeServer.address().port;
  let host = nodeServer.address().address;
  console.log("App working on: ", host, port);
});
