const express = require("express");
const router = express.Router();
const pool = require("../DB/dbPool");

// 입출차 정보 조회
router.get("/getParkingIOList", async (req, res, next) => {
  let {
    serviceKey = "111111111", // 서비스 인증키
    numOfRows = 10, //           페이지 당 결과수
    pageNo = 1, //               페이지 번호
    startDate = "",
    endDate = "",
    dongCode = "",
    hoCode = "",
    sendResult = "",
    carNo = "",
  } = req.query;
  console.log(
    serviceKey,
    numOfRows,
    pageNo,
    startDate,
    endDate,
    dongCode,
    hoCode,
    sendResult,
    carNo
  );

  try {
    let defaultCondition = `LIKE '%'`;
    let defaultStartDateCondition = "";
    let defaultEndDateCondition = "";
    let defaultDongCondition = defaultCondition;
    let defaultHoCondition = defaultCondition;
    let defaultSendResultCondition = defaultCondition;
    let defaultCarNoCondition = defaultCondition;

    let dongCondition = "";
    let hoCondition = "";
    let sendResultCondition = "";
    let carNoCondition = "";

    if (!startDate) {
      defaultStartDateCondition = "1900-01-01";
    }
    if (!endDate) {
      defaultEndDateCondition = "3000-01-01";
    }
    if (!!dongCode) {
      dongCondition = `= '${dongCode}'`;
      defaultDongCondition = "";
    }
    if (!!hoCode) {
      hoCondition = `= '${hoCode}'`;
      defaultHoCondition = "";
    }
    if (!!sendResult) {
      sendResultCondition = `= '${sendResult}'`;
      defaultSendResultCondition = "";
    }
    if (!!carNo) {
      carNoCondition = `= '${carNo}'`;
      defaultCarNoCondition = "";
    }

    let sRow = (pageNo - 1) * numOfRows;
    let size = numOfRows * 1;

    const sql = `SELECT ROW_NUMBER() OVER(ORDER BY idx) AS No, inout_dtime AS inoutDtime, 
                          inout_flag AS inoutFlag, dong_code AS dongCode, ho_code AS hoCode,
                          car_no AS carNo, send_time AS sendTime, send_result AS sendResult
                   FROM t_parking_io
                   WHERE (DATE(inout_dtime) >= '${defaultStartDateCondition} ${startDate}' AND DATE(inout_dtime) <= '${defaultEndDateCondition} ${endDate}')
                         AND (dong_code ${defaultDongCondition} ${dongCondition} AND ho_code ${defaultHoCondition} ${hoCondition})
                         AND send_result ${defaultSendResultCondition} ${sendResultCondition}
                         AND car_no ${defaultCarNoCondition} ${carNoCondition}`;
    const data = await pool.query(sql, [Number(sRow), Number(size)]);
    console.log("sql: " + sql);
    let resultList = data[0];

    const sql2 = `SELECT count(idx) as cnt
                  FROM t_parking_io
                  WHERE (DATE(inout_dtime) >= '${defaultStartDateCondition} ${startDate}' AND DATE(inout_dtime) <= '${defaultEndDateCondition} ${endDate}')
                         AND (dong_code ${defaultDongCondition} ${dongCondition} AND ho_code ${defaultHoCondition} ${hoCondition})
                         AND send_result ${defaultSendResultCondition} ${sendResultCondition}
                         AND car_no ${defaultCarNoCondition} ${carNoCondition}`;
    const data2 = await pool.query(sql2);
    let resultCnt = data2[0];

    let jsonResult = {
      resultCode: "00",
      resultMsg: "NORMAL_SERVICE",
      numOfRows,
      pageNo,
      totalCount: resultCnt[0].cnt + "",
      data: {
        items: resultList,
      },
    };
    return res.json(jsonResult);
  } catch (error) {
    return res.status(500).json(error);
  }
});

// 입출차 정보 삭제
router.delete("/deleteParkingIOList", async (req, res, next) => {
  let { idx = 0 } = req.body;
  console.log(idx);

  try {
    const sql = `DELETE FROM t_parking_io WHERE idx = ?`;
    console.log("sql: " + sql);
    const data = await pool.query(sql, [idx]);
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
