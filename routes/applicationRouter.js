const express = require("express");
const router = express.Router();
const pool = require("../DB/dbPool");

// 민원 목록 조회
router.get("/getApplicationList", async (req, res, next) => {
  let {
    startDate = "",
    endDate = "",
    appReceiptDate = "",
    dongCode = "",
    hoCode = "",
  } = req.query;
  console.log(startDate, endDate, appReceiptDate, dongCode, hoCode);

  try {
    let defaultCondition = `LIKE '%'`;
    let defaultAppReceiptDateCondition = defaultCondition;
    let defaultDongCodeCondition = defaultCondition;
    let defaultHoCodeCondition = defaultCondition;

    let defaultStartDateCondition = "";
    let defaultEndDateCondition = "";

    let appReceiptDateCondition = "";
    let dongCodeCondition = "";
    let hoCodeCondition = "";

    if (!startDate) {
      defaultStartDateCondition = "1900-01-01";
    }
    if (!endDate) {
      defaultEndDateCondition = "3000-01-01";
    }
    if (!!appReceiptDate) {
      appReceiptDateCondition = `= '${appReceiptDate}'`;
      defaultAppReceiptDate = "";
    }
    if (!!dongCode) {
      dongCodeCondition = `= '${dongCode}'`;
      defaultDongCodeCondition = "";
    }
    if (!!hoCode) {
      hoCodeCondition = `= '${hoCode}'`;
      defaultHoCodeCondition = "";
    }

    const sql = `SELECT ROW_NUMBER() OVER(ORDER BY idx) AS No, DATE_FORMAT(app_date, '%Y-%m-%d') AS appReceiptDate,
                        app_method AS appMethod, DATE_FORMAT(app_complete_date, '%Y-%m-%d') AS appCompleteDate,
                        progress_status AS progressStatus
                 FROM t_application_complaint
                 WHERE (DATE(app_receipt_date) >= '${defaultStartDateCondition} ${startTime}' AND DATE(app_receipt_date) <= '${defaultEndDateCondition} ${endTime}')
                       AND (dong_code ${defaultDongCodeCondition} ${dongCodeCondition} AND ho_code ${defaultHoCodeCondition} ${hoCodeCondition})
                       AND app_date ${defaultAppReceiptDateCondition} ${appReceiptDate}`;
    console.log("sql: " + sql);

    let resultList = data[0];

    let jsonResult = {
      resultCode: "00",
      resultMsg: "NORMAL_SERVICE",
      data: {
        items: resultList,
      },
    };
    return res.json(jsonResult);
  } catch (error) {
    return res.status(500).json(error);
  }
});

module.exports = router;
