const express = require("express");
const router = express.Router();
const pool = require("../DB/dbPool");

// 주요 연락처 조회
router.get("/getKeyContract", async (req, res, next) => {
  let { contactFlag = "" } = req.query;
  console.log(contactFlag);

  try {
    let defaultCondition = `LIKE '%'`;
    let contactFlagCondition = "";
    if (!!contactFlag) {
      contactFlagCondition = `= '${contactFlag}'`;
      defaultCondition = "";
    }
    const sql = `SELECT ROW_NUMBER() OVER(ORDER BY idx) AS No, contact_flag AS contactFlag, facility_name AS facilityName, phone_num AS phoneNum,
                        DATE_FORMAT(insert_dtime, '%Y-%m-%d') AS insertDTime
                 FROM t_key_contact
                 WHERE contact_flag ${defaultCondition} ${contactFlagCondition}`;
    console.log("sql: " + sql);
    const data = await pool.query(sql);
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

// 주요 연락처 등록
router.post("/postKeyContract", async (req, res, next) => {
  let {
    contactFlag = "",
    facilityName = "",
    phoneNum = "",
    memo = "",
  } = req.query;
  console.log(contactFlag, facilityName, phoneNum, memo);

  try {
    const sql = `INSERT INTO t_key_contact(phone_num, contact_flag, facility_name, memo, insert_dtime)
                 VALUES(?,?,?,?,now())`;
    const data = await pool.query(sql, [
      contactFlag,
      facilityName,
      phoneNum,
      memo,
    ]);
    console.log("data[0]=>" + data[0]);

    let jsonResult = {
      resultCode: "00",
      resultMsg: "NORMAL_SERVICE",
    };

    return res.json(jsonResult);
  } catch (error) {
    return res.status(500).json(error);
  }
});

module.exports = router;
