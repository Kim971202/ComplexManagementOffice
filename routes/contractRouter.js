const express = require("express");
const router = express.Router();
const pool = require("../DB/dbPool");
const {
  upload,
  checkUploadType,
  deleteFile,
} = require("../modules/fileUpload");
const { getServerIp } = require("../modules/ipSearch");

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
router.post(
  "/updateContract",
  upload.single("file"),
  async (req, res, next) => {
    let {
      idx = 0,
      contractDate = "",
      contractTitle = "",
      contractContent = "",
    } = req.body;
    console.log(idx, contractDate, contractTitle, contractContent);
    checkUploadType(3);
    try {
      const oSQL = `SELECT contract_title AS contracTitle, contract_content AS contractContent, file_name AS fileName FROM t_contract_document
                    WHERE idx = ?`;
      console.log("oSQL: " + oSQL);
      const data = await pool.query(oSQL, [idx]);

      if (!contractTitle) contractTitle = data[0][0].contracTitle;
      if (!contractContent) contractContent = data[0][0].contractContent;
      let a = data[0][0].fileName;
      console.log(a);
      if (!req.file) {
        console.log("no file selected");
      } else if (req.file.originalname !== data[0][0].fileName) {
        deleteFile(a);
        // TODO: 파일 경로, 파일명만 해당 idx에 row에서 수정 한다
        let fileName = req.file.originalname;
        let filePath =
          `http://${getServerIp()}:3000/` + req.file.destination + fileName;
        const sql = `UPDATE t_contract_document SET contract_title = ?, contract_content = ?, file_path = ?, file_name = ? WHERE idx = ?`;
        const data = await pool.query(sql, [
          contractTitle,
          contractContent,
          filePath,
          fileName,
          idx,
        ]);
        let jsonResult = {
          resultCode: "00",
          resultMsg: "NORMAL_SERVICE",
        };
        return res.json(jsonResult);
      }

      const sql = `UPDATE t_contract_document SET contract_title = ?, contract_content = ? WHERE idx = ?`;
      console.log("sql: " + sql);
      const data1 = await pool.query(sql, [
        contractTitle,
        contractContent,
        idx,
      ]);
      let jsonResult = {
        resultCode: "00",
        resultMsg: "NORMAL_SERVICE",
      };
      return res.json(jsonResult);
    } catch (error) {
      return res.status(500).json(error);
    }
  }
);

// 계약 자료 등록
router.post(
  "/uploadContract",
  upload.single("file"),
  async (req, res, next) => {
    let {
      contractDate = "",
      contractTitle = "",
      contractContent = "",
      userID = "",
    } = req.body;
    console.log(contractDate, contractTitle, contractContent, userID);
    checkUploadType(3);
    let fileName = req.file.originalname;
    let filePath =
      `http://${getServerIp()}:3000/` + req.file.destination + fileName;
    console.log(contractDate, contractTitle, contractContent, userID);
    try {
      const sql = `INSERT INTO t_contract_document(contract_date, contract_title, contract_content, file_path, insert_dtime, user_id, file_name)
                     VALUES(DATE_FORMAT(?,"%y-%m-%d"),?,?,?,now(),?,?)`;
      console.log("sql: " + sql);
      const data = await pool.query(sql, [
        contractDate,
        contractTitle,
        contractContent,
        filePath,
        userID,
        fileName,
      ]);
      let jsonResult = {
        resultCode: "00",
        resultMsg: "NORMAL_SERVICE",
      };
      return res.json(jsonResult);
    } catch (error) {
      return res.status(500).json(error);
    }
  }
);

module.exports = router;
