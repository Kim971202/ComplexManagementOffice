const express = require("express");
const router = express.Router();
const pool = require("../DB/dbPool");

const multer = require("multer");
const upload = multer({
  dest: __dirname + "/uploads/", // 이미지 업로드 경로
});
// 계약 자료 조회
router.get("/getContractList", async (req, res, next) => {
  let { startDate = "", endDate = "", contractTitle = "" } = req.query;
  console.log(startDate, endDate, contractTitle);

  try {
    let defaultCondition = `LIKE '%'`;
    let defaultContractTitleCondition = defaultCondition;

    let defaultStartDateCondition = "";
    let defaultEndDateCondition = "";

    let contractTitleCondition = "";

    if (!startDate) {
      defaultStartDateCondition = "1900-01-01";
    }
    if (!endDate) {
      defaultEndDateCondition = "3000-01-01";
    }
    if (!!contractTitle) {
      contractTitleCondition = `LIKE '${contractTitle}%'`;
      defaultContractTitleCondition = "";
    }

    const sql = `SELECT ROW_NUMBER() OVER(ORDER BY idx) AS No, contract_title AS contractTitle, 
                        DATE_FORMAT(contract_date, '%Y-%m-%d') AS contractDate
                 FROM t_contract_document
                 WHERE (DATE(contract_date) >= '${defaultStartDateCondition} ${startDate}' AND DATE(contract_date) <= '${defaultEndDateCondition} ${endDate}') 
                       AND contract_title ${defaultContractTitleCondition} ${contractTitleCondition}`;
    console.log("sql: " + sql);
    const data = await pool.query(sql);
    let resultList = data[0];
    let jsonResult = {
      resultList,
    };
    return res.json(jsonResult);
  } catch (error) {
    return res.status(500).json(error);
  }
});

// 계약 자료 상세 조회
router.get("/getDetailedContractList", async (req, res, next) => {
  let { idx = 0 } = req.query;
  console.log(idx);

  try {
    const sql = `SELECT DATE_FORMAT(contract_date, '%Y-%m-%d %h:%i:%s') AS contractDate, contract_title AS contractTitle, contract_content AS contractContent, 
                        file_path AS filePath, file_name AS fileName
                  FROM t_contract_document
                  WHERE idx = ?`;
    console.log("sql: " + sql);
    const data = await pool.query(sql, [idx]);
    let resultList = data[0];
    let jsonResult = {
      resultCode: "00",
      resultMsg: "NORMAL_SERVICE",
      data: {
        resultList,
      },
    };
    return res.json(jsonResult);
  } catch (error) {
    return res.status(500).json(error);
  }
});

// 계약 자료 수정
router.post("/updateContract", async (req, res, next) => {
  let { idx = 0, contractTitle = "", contractDesc = "" } = req.body;
  console.log(idx, contractTitle, contractDesc);

  try {
    const oSQL = `SELECT contract_title AS contracTitle, contract_content AS contractDesc FROM t_contract_document
                  WHERE idx = ?`;
    console.log("oSQL: " + oSQL);
    const data = await pool.query(oSQL, [idx]);

    if (!contractTitle) contractTitle = data[0][0].contracTitle;
    if (!contractDesc) contractDesc = data[0][0].contractDesc;

    const sql = `UPDATE t_contract_document SET contract_title = ?, contract_content = ? WHERE idx = ?`;
    console.log("sql: " + sql);
    const data1 = await pool.query(sql, [contractTitle, contractDesc, idx]);
    let jsonResult = {
      resultCode: "00",
      resultMsg: "NORMAL_SERVICE",
    };
    return res.json(jsonResult);
  } catch (error) {
    return res.status(500).json(error);
  }
});

// 계약 자료 등록
router.post("/uploadContract", upload.single("file"), (req, res, next) => {
  const {
    fieldname,
    originalname,
    encoding,
    mimetype,
    destination,
    filename,
    path,
    size,
  } = req.file;
  const { name } = req.body;
  // 파일 경로 및 이름 설정 옵션
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "/tmp/my-uploads"); // 파일 업로드 경로
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname + "-" + Date.now()); //파일 이름 설정
    },
  });
  const upload = multer({ storage: storage });
  console.log("body 데이터 : ", name);
  console.log("폼에 정의된 필드명 : ", fieldname);
  console.log("사용자가 업로드한 파일 명 : ", originalname);
  console.log("파일의 엔코딩 타입 : ", encoding);
  console.log("파일의 Mime 타입 : ", mimetype);
  console.log("파일이 저장된 폴더 : ", destination);
  console.log("destinatin에 저장된 파일 명 : ", filename);
  console.log("업로드된 파일의 전체 경로 ", path);
  console.log("파일의 바이트(byte 사이즈)", size);

  res.json({ ok: true, data: "Single Upload Ok" });
});

module.exports = router;
