const express = require("express");
const router = express.Router();
const pool = require("../DB/dbPool");
const xlsx = require("xlsx");

const evchargingExcelSQL = `SELECT DATE_FORMAT(charge_start_dtime, '%Y-%m-%d-%h-%i-%s') as 시작일, dong_code as dongCode, ho_code as hoCode, charger_loc AS chargerLoc,
                                  charger_type AS  chargerType,
                                  charge_amount AS fillingAmount, use_fee AS chargeUseFee  
                          FROM t_ev_charging_log`;

const dowonloadDBToExcel = async () => {
  const workbook = xlsx.utils.book_new();
  const evcharging = await pool.query(evchargingExcelSQL);
  //evcharging[0][0].idx;
  const firstSheet = xlsx.utils.json_to_sheet(evcharging[0]);
  xlsx.utils.book_append_sheet(workbook, firstSheet, "전기차 충전이력");
  xlsx.writeFile(
    workbook,
    "C:UsersdsctDesktopCMOComplexManagementOfficemodulesexcelev.xlsx"
  );
};

dowonloadDBToExcel();

let {
  viewPeriodDate,
  addDays,
  isDate,
  strDateFormat,
  getDateOfMonthByFlag,
} = require("../modules/dataFunction");

//TODO: excel 다운로드 추가

//전기차충전 이력 리스트 전체 조회
router.get("/getAllEVChargingLog", async (req, res, next) => {
  let {
    serviceKey = "111111111", // 서비스 인증키
    numOfRows = 10, //           페이지 당 결과수
    pageNo = 1, //               페이지 번호
    doubleDataFlag = "Y", //     2배수 데이터 사용여부
    dongCode = "0000", //        동코드
    hoCode = "0000", //          호코드
  } = req.query;

  console.log(serviceKey, numOfRows, pageNo, dongCode, hoCode, doubleDataFlag);
  //http://localhost:3000/evcharging/getEVChargingLog?serviceKey=22222&numOfRows=5&pageNo=1&dongCode=101&hoCode=101&doubleDataFlag=Y
  //&viewPeriod=ALL
  try {
    let sRow = (pageNo - 1) * numOfRows;

    let size = numOfRows * (doubleDataFlag === "Y" ? 2 : 1);

    const viewSQL = `select idx, charger_id as chargerID, charger_loc as chargerLoc, 
                        (
                          CASE WHEN charger_type = '완속' THEN 'slow'
                               WHEN charger_type = '급속' THEN 'fast'
                              ELSE '-'
                          END
                        ) as  chargerType,
                        charger_status as chargerStatus,
                        DATE_FORMAT(charge_start_dtime, '%Y%m%d%h%i%s') as startDTime, 
                        DATE_FORMAT(charge_end_dtime, '%Y%m%d%h%i%s') as endDTime,
                        charge_remain_time as remainTime, use_fee as chargeUseFee, charge_amount as fillingAmount
                 from t_ev_charging_log 
                 `;
    //limit ?, ?
    console.log("viewSQL=>" + viewSQL);
    // [Number(sRow),Number(size)]
    const data = await pool.query(viewSQL);
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
//전기차충전 이력 리스트 검색 조회
router.get("/getSearchedEVChargingLog", async (req, res, next) => {
  let {
    serviceKey = "111111111", // 서비스 인증키
    numOfRows = 10, //           페이지 당 결과수
    pageNo = 1, //               페이지 번호
    doubleDataFlag = "Y", //     2배수 데이터 사용여부
    dongCode = "0000", //        동코드
    hoCode = "0000", //          호코드
  } = req.query;

  console.log(serviceKey, numOfRows, pageNo, dongCode, hoCode, doubleDataFlag);
  //http://localhost:3000/evcharging/getEVChargingLog?serviceKey=22222&numOfRows=5&pageNo=1&dongCode=101&hoCode=101&doubleDataFlag=Y
  //&viewPeriod=ALL
  try {
    let sRow = (pageNo - 1) * numOfRows;

    let size = numOfRows * (doubleDataFlag === "Y" ? 2 : 1);

    const viewSQL = `SELECT idx, charger_id AS chargerID, charger_loc AS chargerLoc, 
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
                     F0ROM t_ev_charging_log WHERE ((DATE(charge_start_dtime) >= ? AND DATE(charge_end_dtime) <= ?)) 
                          AND (dong_code = ? OR ho_code = ?) 
                          AND charger_loc = ?
                          AND (CASE WHEN charger_type = '완속' THEN 'slow'WHEN charger_type = '급속' THEN 'fast'ELSE '-' END) = ?
                          AND charge_amount = ?
                          AND use_fee = ?;`;

    console.log("viewSQL=>" + viewSQL);
    const data = await pool.query(viewSQL);
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
//전기차충전 이력 리스트 상세조회
router.get("/getDeatiledEVChargingLog", async (req, res, next) => {
  let {
    serviceKey = "111111111", // 서비스 인증키
    idx,
    dongCode = "0000", //        동코드
    hoCode = "0000", //          호코드
    //viewPeriod = "ALL", //       조회기간전체: (ALL)/일주일(1WEEK)/1개월(1MONTH)/3개월(3MONTH)
  } = req.query;

  console.log(serviceKey, idx, dongCode, hoCode);

  try {
    let sRow = (pageNo - 1) * numOfRows;
    let size = numOfRows * (doubleDataFlag === "Y" ? 2 : 1);

    const sql = `SELECT DATE_FORMAT(charge_start_dtime, '%Y%m%d%h%i%s') AS startDTime, dong_code AS dongCode, ho_code AS hoCode, charger_loc AS chargerLoc, (
                        CASE WHEN charger_type = '완속' THEN 'slow'
                            WHEN charger_type = '급속' THEN 'fast'
                            ELSE '-'
                        END
                      ) AS  chargerType, charge_amount AS elecAmount, use_fee AS chargeUseFee, DATE_FORMAT(charge_start_dtime, '%Y%m%d%h%i%s') AS insertDate
                FROM t_ev_charging_log
                WHERE idx = ? AND dong_code = ? AND ho_code = ?;`;

    console.log("sql=>" + sql);
    const data = await pool.query(sql, [idx, dongCode, hoCode]);
    let resultList = data[0];

    let jsonResult = {
      resultCode: "00",
      resultMsg: "NORMAL_SERVICE",
      numOfRows,
      pageNo,
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
