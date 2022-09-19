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

//TODO: excel 다운로드 추가

//전기차충전 이력 리스트 조회
router.get("/getEVChargingLog", async (req, res, next) => {
  let {
    serviceKey = "111111111", // 서비스 인증키
    numOfRows = 10, //           페이지 당 결과수
    pageNo = 1, //               페이지 번호
    doubleDataFlag = "Y", //     2배수 데이터 사용여부
    dongCode = "0000", //        동코드
    hoCode = "0000", //          호코드
    //viewPeriod = "ALL", //       조회기간전체: (ALL)/일주일(1WEEK)/1개월(1MONTH)/3개월(3MONTH)
  } = req.query;

  console.log(serviceKey, numOfRows, pageNo, dongCode, hoCode, doubleDataFlag);

  try {
    let sRow = (pageNo - 1) * numOfRows;
    let size = numOfRows * (doubleDataFlag === "Y" ? 2 : 1);

    const sql = `SELECT idx, charger_id AS chargerID, charger_loc AS chargerLoc, 
                          (
                            CASE WHEN charger_type = '완속' THEN 'slow'
                                 WHEN charger_type = '급속' THEN 'fast'
                                ELSE '-'
                            END
                          ) AS  chargerType,
                          charger_status as chargerStatus,
                          DATE_FORMAT(charge_start_dtime, '%Y%m%d%h%i%s') AS startDTime, 
                          DATE_FORMAT(charge_end_dtime, '%Y%m%d%h%i%s') AS endDTime,
                          charge_remain_time AS remainTime, use_fee AS chargeUseFee, charge_amount AS fillingAmount
                   FROM t_ev_charging_log WHERE dong_code = ? AND ho_code = ?  AND charge_start_dtime = ? AND charge_end_dtime = ? AND charger_loc = ?
                   LIMIT ?, ?`;

    console.log("sql=>" + sql);
    const data = await pool.query(sql, [
      dongCode,
      hoCode,
      Number(sRow),
      Number(size),
    ]);
    let resultList = data[0];

    const sql2 =
      "select count(*) as cnt from t_ev_charging_log where dong_code = ? and ho_code = ?";
    const data2 = await pool.query(sql2, [dongCode, hoCode]);

    let resultCnt = data2[0];

    console.log("resultList : ", resultList);

    let jsonResult = {
      resultCode: "00",
      resultMsg: "NORMAL_SERVICE",
      numOfRows,
      pageNo,
      totalCount: resultCnt[0].cnt + "",
      doubleDataFlag,
      data: {
        dongCode,
        hoCode,
        items: resultList,
      },
    };

    return res.json(jsonResult);
  } catch (err) {
    return res.status(500).json(err);
  }
});

module.exports = router;
