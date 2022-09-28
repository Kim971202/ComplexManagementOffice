const express = require("express");
const router = express.Router();
const pool = require("../DB/dbPool");

// 에너지 조회
router.get("/getEMS", async (req, res, next) => {
  let { startDate = "", endDate = "", dongCode = "", hoCode = "" } = req.query;
  console.log(startDate, endDate, dongCode, hoCode);

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
        resultList,
      },
    };
    return res.json(jsonResult);
  } catch (error) {
    return res.status(500).json(error);
  }
});

// 에너지 상세 조회
router.get("/getDetailedEMS", async (req, res, next) => {
  let { startDate = "", endDate = "", dongCode = "", hoCode = "" } = req.query;
  console.log(startDate, endDate, dongCode, hoCode);

  try {
    const sql = `SELECT ROW_NUMBER() OVER(ORDER BY energy_dtime) AS No,  DATE_FORMAT(energy_dtime, '%Y-%m-%d') AS date,
                            CONCAT('meter: ', elec_meter, ' usage: ', elec_usage) AS elec,
                            CONCAT('meter: ', water_meter,' usage: ', water_usage) AS water,
                            CONCAT('meter: ', hot_water_meter, ' usage: ', hot_water_usage) AS hotWater,
                            CONCAT('meter: ', heating_meter, ' usage: ', heating_usage) AS heating
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

module.exports = router;
