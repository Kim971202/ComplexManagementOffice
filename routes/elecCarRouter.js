const express = require("express");
const router = express.Router();
const pool = require("../DB/dbPool");
const xlsx = require("xlsx");

// Excel 다운로드
// const evchargingExcelSQL = `SELECT DATE_FORMAT(charge_start_dtime, '%Y-%m-%d-%h-%i-%s') as 시작일, dong_code as dongCode, ho_code as hoCode, charger_loc AS chargerLoc,
//                                   charger_type AS  chargerType,
//                                   charge_amount AS fillingAmount, use_fee AS chargeUseFee
//                           FROM t_ev_charging_log`;

// const dowonloadDBToExcel = async () => {
//   const workbook = xlsx.utils.book_new();
//   const evcharging = await pool.query(evchargingExcelSQL);
//   //evcharging[0][0].idx;
//   const firstSheet = xlsx.utils.json_to_sheet(evcharging[0]);
//   xlsx.utils.book_append_sheet(workbook, firstSheet, "전기차 충전이력");
//   xlsx.writeFile(
//     workbook,
//     "C:UsersdsctDesktopCMOComplexManagementOfficemodulesexcelev.xlsx"
//   );
// };
// dowonloadDBToExcel();

let {
  viewPeriodDate,
  addDays,
  isDate,
  strDateFormat,
  getDateOfMonthByFlag,
} = require("../modules/dataFunction");

// 전기차충전 이력 리스트 조회
router.get("/getSearchedEVChargingLog", async (req, res, next) => {
  let {
    starTime = "",
    endTime = "",
    chargerLoc = "",
    dongCode = "", //        동코드
    hoCode = "", //          호코드
  } = req.query;

  console.log(starTime, endTime, chargerLoc, dongCode, hoCode);

  try {
    let defaultCondition = `Like '%'`;
    let defaultChargerLocCondition = defaultCondition;
    let defaultDongCondition = defaultCondition;
    let defaultHoCondition = defaultCondition;

    let defaultStartTimeCondition = "";
    let defaultEndTimeCondition = "";

    let dongCondition = "";
    let hoCondition = "";
    let chargerLocCondition = "";

    if (!starTime) {
      defaultStartTimeCondition = "1900-01-01";
    }
    if (!endTime) {
      defaultEndTimeCondition = "3000-01-01";
    }
    if (!!dongCode) {
      dongCondition = `= '${dongCode}'`;
      defaultDongCondition = "";
    }
    if (!!hoCode) {
      hoCondition = `= '${hoCode}'`;
      defaultHoCondition = "";
    }
    if (!!chargerLoc) {
      chargerLocCondition = `= '${chargerLoc}'`;
      defaultChargerLocCondition = "";
    }

    const sql = `SELECT ROW_NUMBER() OVER(ORDER BY idx) AS No, dong_code AS dongCode, ho_code AS hoCode, 
                        charger_loc AS chargerLoc, charger_type AS chargerType, charge_amount AS chargeAmount,
                        DATE_FORMAT(charge_start_dtime, '%Y-%m-%d %h:%i:%s') AS chargeStartDtime,
                        DATE_FORMAT(charge_end_dtime, '%Y-%m-%d %h:%i:%s') AS chargeEndDtime,
                        use_fee AS useFee
                 FROM t_ev_charging_log
                 WHERE (DATE(charge_start_dtime) >= '${defaultStartTimeCondition} ${starTime}' AND DATE(charge_end_dtime) <= '${defaultEndTimeCondition} ${endTime}') 
                       AND (dong_code ${defaultDongCondition} ${dongCondition} AND ho_code ${defaultHoCondition} ${hoCondition}) 
                       AND charger_loc ${defaultChargerLocCondition} ${chargerLocCondition}`;

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
// 전기차충전 이력 리스트 상세조회
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
// 전기차충전 이력 삭제
router.delete("/deleteEVChargingLog", async (req, res, next) => {
  let { idx = 0 } = req.body;
  console.log(idx);

  try {
    const sql = `DELETE FROM t_ev_charging_log WHERE idx = ?`;
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
