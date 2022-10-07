const express = require("express");
const router = express.Router();
const pool = require("../DB/dbPool");
const { checkServiceKeyResult } = require("../modules/authentication");

// 에너지 조회
router.get("/getEMS", async (req, res, next) => {
  let {
    serviceKey = "",
    startDate = "",
    endDate = "",
    dongCode = "",
    hoCode = "",
  } = req.query;
  console.log(serviceKey, startDate, endDate, dongCode, hoCode);

  try {
    let = defaultCondition = `LIKE '%'`;
    let = defaultDongCode = defaultCondition;
    let = defaultHoCode = defaultCondition;

    let defaultStartDate = "";
    let defaultEndDate = "";

    let dongCondition = "";
    let hoCondition = "";

    if (!startDate) defaultStartDate = "1900-01-01";
    if (!endDate) defaultEndDate = "3000-01-01";

    if (!!dongCode) {
      dongCondition = `= '${dongCode}'`;
      defaultDongCode = "";
    }

    if (!!hoCode) {
      hoCondition = `= '${hoCode}'`;
      defaultHoCode = "";
    }

    const sql = `SELECT ROW_NUMBER() OVER(ORDER BY energy_dtime) AS No,  DATE_FORMAT(energy_dtime, '%m') AS month, ho_code AS hoCode, 
                            CONCAT('meter: ', elec_meter, ' usage: ', elec_usage) AS elec,
                            CONCAT('meter: ', water_meter,' usage: ', water_usage) AS water,
                            CONCAT('meter: ', hot_water_meter, ' usage: ', hot_water_usage) AS hotWater,
                            CONCAT('meter: ', heating_meter, ' usage: ', heating_usage) AS heating,
                            CONCAT('meter: ',  "-", ' usage: ', "-") AS etc
                     FROM t_energy
                     WHERE (DATE(energy_dtime) >= '${defaultStartDate} ${startDate}' AND DATE(energy_dtime) <= '${defaultEndDate} ${endDate}')
                            AND (dong_code ${defaultDongCode} ${dongCondition} AND ho_code ${defaultDongCode} ${hoCondition})
                            LIMIT 15`;
    console.log("sql: " + sql);
    const data = await pool.query(sql);
    let resultList = data[0];
    console.log(resultList);
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

// 에너지 상세 조회
router.get("/getDetailedEMS", async (req, res, next) => {
  let {
    serviceKey = "",
    startDate = "",
    endDate = "",
    dongCode = "",
    hoCode = "",
    energyType = "",
  } = req.query;
  console.log(serviceKey, startDate, endDate, dongCode, hoCode, energyType);
  if ((await checkServiceKeyResult(serviceKey)) == false) {
    return res.json({
      resultCode: "30",
      resultMsg: "등록되지 않은 서비스키 입니다.",
    });
  }
  try {
    let elecSQL = `CONCAT('meter: ', elec_meter, ' usage: ', elec_usage) AS elec`;
    let waterSQL = `CONCAT('meter: ', water_meter,' usage: ', water_usage) AS water`;
    let hotWaterSQL = `CONCAT('meter: ', hot_water_meter, ' usage: ', hot_water_usage) AS hotWater`;
    let heatingSQL = `CONCAT('meter: ', heating_meter, ' usage: ', heating_usage) AS heating`;
    let condition = "";
    if (energyType == "elec") {
      waterSQL = "";
      hotWaterSQL = "";
      heatingSQL = "";
    } else if (energyType == "water") {
      elecSQL = "";
      hotWaterSQL = "";
      heatingSQL = "";
    } else if (energyType == "hotWater") {
      waterSQL = "";
      elecSQL = "";
      heatingSQL = "";
    } else if (energyType == "heating") {
      waterSQL = "";
      hotWaterSQL = "";
      elecSQL = "";
    } else {
      condition = `,`;
      console.log("energyType : ALL");
    }

    const sql = `SELECT ROW_NUMBER() OVER(ORDER BY energy_dtime) AS No,  DATE_FORMAT(energy_dtime, '%Y-%m-%d') AS date,
                            ${elecSQL} ${condition} ${waterSQL} ${condition} ${hotWaterSQL} ${condition} ${heatingSQL}
                     FROM t_energy
                     WHERE (DATE(energy_dtime) >= ? AND DATE(energy_dtime) <= ?)
                            AND (dong_code = ? AND ho_code = ?)`;
    console.log("sql: " + sql);
    const data = await pool.query(sql, [startDate, endDate, dongCode, hoCode]);
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

// 에너지 관리 조회
router.get("/getEMSManage", async (req, res, next) => {
  let {
    currentYear = "",
    currentMonth = "",
    selectedYear = "", // 년도 선택
    selectedMonth = "", // 월 선택
    energyType = "", // 에너지 유형
    dongCode = "",
    hoCode = "",
  } = req.query;
  console.log(selectedYear, selectedMonth, energyType);
  if ((await checkServiceKeyResult(serviceKey)) == false) {
    return res.json({
      resultCode: "30",
      resultMsg: "등록되지 않은 서비스키 입니다.",
    });
  }
  try {
    const tSQL = `SELECT DATE_FORMAT(now(), '%Y') AS currentYear, DATE_FORMAT(now(), '%m') AS currentMonth`;
    const yearMonth = await pool.query(tSQL);
    if (!selectedYear) currentYear = yearMonth[0][0].currentYear;
    if (!selectedMonth) currentMonth = yearMonth[0][0].currentMonth;

    let sql = "";

    sql =
      (selectedYear && selectedMonth) || (currentYear && currentMonth)
        ? (sql += "CALL spMonthEnergyUseCall (?,?,?,?,?)")
        : (sql += "CALL spYearEnergyUse (?, ?, ?, ?) ");

    console.log("sql=>" + sql);
    let data = "";
    data =
      selectedYear && selectedMonth
        ? (data = await pool.query(sql, [
            energyType,
            selectedYear,
            selectedMonth,
            dongCode,
            hoCode,
          ]))
        : (data = await pool.query(sql, [
            energyType,
            selectedYear,
            dongCode,
            hoCode,
          ]));

    let resultList = data[0][0];
    console.log(resultList);
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

module.exports = router;
