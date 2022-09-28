const express = require("express");
const router = express.Router();
const pool = require("../DB/dbPool");

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

// 계약 자료 등록

module.exports = router;
