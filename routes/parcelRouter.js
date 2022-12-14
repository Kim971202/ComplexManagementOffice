const express = require("express");
const router = express.Router();
const pool = require("../DB/dbPool");
let {
  viewPeriodDate,
  addDays,
  isDate,
  strDateFormat,
  getDateOfMonthByFlag,
} = require("../modules/dataFunction");
const checkServiceKeyResult = require("../modules/authentication");

// 택배 정보 조회
router.get("/getParcelList", async (req, res, next) => {
  let {
    serviceKey = "111111111", // 서비스 인증키
    numOfRows = 10, //           페이지 당 결과수
    pageNo = 1, //               페이지 번호
    startDate = "",
    endDate = "",
    dongCode = "",
    hoCode = "",
    parcelStatus = "",
    sendResult = "",
  } = req.query;

  console.log(
    serviceKey,
    numOfRows,
    pageNo,
    startDate,
    endDate,
    dongCode,
    hoCode,
    parcelStatus,
    sendResult
  );

  let sRow = (pageNo - 1) * numOfRows;
  let size = numOfRows * 1;

  let parcelStatus_ = "%";

  if (parcelStatus === "LOCKER") parcelStatus_ = "0";
  else if (parcelStatus === "RETURN") parcelStatus_ = "1";
  else if (parcelStatus === "RECEIPT") parcelStatus_ = "2";
  console.log("parcelStatus_=>" + parcelStatus_);
  if ((await checkServiceKeyResult(serviceKey)) == false) {
    return res.json({
      resultCode: "30",
      resultMsg: "등록되지 않은 서비스키 입니다.",
    });
  }
  try {
    let defaultCondition = `LIKE '%'`;
    let defaultDongCondition = defaultCondition;
    let defaultHoCondition = defaultCondition;
    let defaultParcelStatusCondition = defaultCondition;
    let defaultSendResultCondition = defaultCondition;

    let dongCondition = "";
    let hoCondition = "";
    let parcelStatusCondition = "";
    let sendResultCondition = "";
    let defaultADateCondition = "";
    let defaultRDateCondition = "";

    // 도착일시 와 수령시간이 없을 경우 Default 날자 값을 넣는다.
    if (!startDate) {
      defaultADateCondition = "1900-01-01";
    }
    if (!endDate) {
      defaultRDateCondition = "3000-01-01";
    }
    if (!!dongCode) {
      dongCondition = `= '${dongCode}'`;
      defaultDongCondition = "";
    }
    if (!!hoCode) {
      hoCondition = `= '${hoCode}'`;
      defaultHoCondition = "";
    }
    if (!!parcelStatus) {
      parcelStatusCondition = `= ${parcelStatus_}`;
      defaultParcelStatusCondition = "";
    }
    if (!!sendResult) {
      sendResultCondition = `= '${sendResult}'`;
      defaultSendResultCondition = "";
    }
    const sql = `SELECT ROW_NUMBER() OVER(ORDER BY idx) AS No, dong_code AS dongCode, ho_code AS hoCode, (parcel_flag) AS parcelFlag, IFNULL(memo, '-') AS parcelCorp, 
                        DATE_FORMAT(arrival_time, '%Y-%m-%d %h:%i:%s') AS arrivalTime, DATE_FORMAT(receive_time, '%Y-%m-%d %h:%i:%s') AS receiveTime,
                        send_result AS sendResult
                FROM t_delivery
                WHERE (DATE(arrival_time) >= '${defaultADateCondition} ${startDate}' AND DATE(receive_time) <= '${defaultRDateCondition} ${endDate}') 
                      AND (dong_code ${defaultDongCondition} ${dongCondition} AND ho_code ${defaultHoCondition} ${hoCondition}) 
                      AND parcel_status ${defaultParcelStatusCondition} ${parcelStatusCondition}
                      AND send_result ${defaultSendResultCondition} ${sendResultCondition}
                      LIMIT ?,?`;

    console.log("sql: " + sql);
    const data = await pool.query(sql, [Number(sRow), Number(size)]);
    let resultList = data[0];
    const sql2 = `SELECT count(idx) as cnt
                  FROM t_delivery
                  WHERE (DATE(arrival_time) >= '${defaultADateCondition} ${startDate}' AND DATE(receive_time) <= '${defaultRDateCondition} ${endDate}') 
                        AND (dong_code ${defaultDongCondition} ${dongCondition} AND ho_code ${defaultHoCondition} ${hoCondition}) 
                        AND parcel_status ${defaultParcelStatusCondition} ${parcelStatusCondition}
                        AND send_result ${defaultSendResultCondition} ${sendResultCondition};`;
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

// 택배 정보 등록
// 경비실에서 받아서 직접 등록
router.post("/postParcel", async (req, res, next) => {
  let {
    parcelStatus = 0,
    dongCode = "",
    hoCode = "",
    parcelCorp = "",
  } = req.body;
  if ((await checkServiceKeyResult(serviceKey)) == false) {
    return res.json({
      resultCode: "30",
      resultMsg: "등록되지 않은 서비스키 입니다.",
    });
  }
  console.log(parcelStatus, dongCode, hoCode, parcelCorp);
  try {
    parcelBoxNo = "00" + 1;
    mailBoxNo = "0" + 1;
    receiver = `${dongCode} - ${hoCode}`;
    del_fee = 1000;
    parcelFlage = "유인";

    let sql = `INSERT INTO t_delivery(arrival_time, parcel_box_no, mail_box_no, receiver, del_fee, dong_code, ho_code, receive_time, parcel_status, parcel_flag, user_id, send_time, send_result, memo)
               VALUES(now(),?,?,?,?,?,?,now(),?,?,'tester',now(),'N',?)`;
    const data = await pool.query(sql, [
      parcelBoxNo,
      mailBoxNo,
      receiver,
      del_fee,
      dongCode,
      hoCode,
      parcelStatus,
      parcelFlage,
      parcelCorp,
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

// 택배 정보 수정
// 수령여부 변경
/**
 * *택배구분
  '무인' : 무인택배
  '경비' : 경비실기
  'PC' : 관리자 PC

  *택배상태
  0 : 미수령(택배도착)
  1 : 수령
  2 : 반품
 * 
 */
router.put("/updateParcel", async (req, res, next) => {
  let { serviceKey = "", idx = 0, parcelStatus = 0 } = req.body;
  console.log(serviceKey, idx, parcelStatus);
  if ((await checkServiceKeyResult(serviceKey)) == false) {
    return res.json({
      resultCode: "30",
      resultMsg: "등록되지 않은 서비스키 입니다.",
    });
  }
  try {
    const sql = `UPDATE t_delivery SET parcel_status = ?, receive_time = now() WHERE idx = ?`;
    console.log("sql: " + sql);
    const data = await pool.query(sql, [parcelStatus, idx]);
    let jsonResult = {
      resultCode: "00",
      resultMsg: "NORMAL_SERVICE",
    };
    return res.json(jsonResult);
  } catch (error) {
    return res.status(500).json(error);
  }
});

// 택배 등록 삭제
router.delete("/deleteParcel", async (req, res, next) => {
  let { serviceKey = "", idx = 0 } = req.body;
  console.log(idx);
  if ((await checkServiceKeyResult(serviceKey)) == false) {
    return res.json({
      resultCode: "30",
      resultMsg: "등록되지 않은 서비스키 입니다.",
    });
  }
  try {
    const sql = `DELETE FROM t_delivery WHERE idx = ?`;
    console.log("sql: " + sql);
    const data = await pool.query(sql, [idx]);
    let resultList = data[0];
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
