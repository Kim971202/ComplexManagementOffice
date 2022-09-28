const express = require("express");
const router = express.Router();
const pool = require("../DB/dbPool");

// 에너지 조회
router.get("/getEMS", async (req, res, next) => {
    let {
        year = "",
        month = "",
        dongCode = "",
        hoCode = ""
    } = req.query;
    console.log(year, month, dongCode, hoCode);

    try {

        let = defaultCondition = `LIKE '%'`;
        let = defaultDongCode = defaultCondition;
        let = defaultHoCode = defaultCondition;

        let defaultYear = "";
        let defaultMonth = "";

        let dongCondition = "";
        let hoCondition = "";

        // if(!year) defaultYear = `'1900'`;
        // if(!month) defaultMonth = `= `

        const sql = `SELECT DATE_FORMAT(energy_dtime, '%i') AS eMonth, ho_code AS hoCode, 
                            CONCAT('meter: ', elec_meter, ' usage: ', elec_usage) AS elec,
                            CONCAT('meter: ', water_meter,' usage: ', water_usage) AS water,
                            CONCAT('meter: ', hot_water_meter, ' usage: ', hot_water_usage) AS hotWater,
                            CONCAT('meter: ', heating_meter, ' usage: ', heating_usage) AS heating,
                     FROM t_energy
                     WHERE `;
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
})

// 에너지 상세 조회
router.get("/getDetailedEMS", async (req, res, next) => {
    let {
        year = "",
        month = "",
        dongCode = "",
        hoCode = ""
    } = req.query;
    console.log(year, month, dongCode, hoCode);

    try {
        const sql = `SELECT DATE_FORMAT(energy_dtime, '%Y-%m-%d') AS dTime,
                            CONCAT('meter: ', elec_meter, ' usage: ', elec_usage) AS elec,
                            CONCAT('meter: ', water_meter,' usage: ', water_usage) AS water,
                            CONCAT('meter: ', hot_water_meter, ' usage: ', hot_water_usage) AS hotWater,
                            CONCAT('meter: ', heating_meter, ' usage: ', heating_usage) AS heating
                     FROM t_energy
                     WHERE `
    } catch (error) {
        return res.status(500).json(error);
    }
})

module.exports = router;
