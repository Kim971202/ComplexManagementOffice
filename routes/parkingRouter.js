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

// 주차위치 정보 조회
router.get("/getCarLocationList", async (req, res, next) => {
  let {
    dongCode = "", //        동코드
    hoCode = "", //          호코드
    startTime = "",
    endTime = "",
    tagName = "", // 차량번호
  } = req.query;

  console.log(dongCode, hoCode, startTime, endTime, tagName);

  try {
    let defaultCondition = `LIKE '%'`;
    let defaultStartDateCondition = "";
    let defaultEndDateCondition = "";
    let defaultDongCondition = defaultCondition;
    let defaultHoCondition = defaultCondition;
    let defaultTagNameCondition = defaultCondition;

    let dongCondition = "";
    let hoCondition = "";
    let tagNameCondition = "";

    if (!startTime) {
      defaultStartDateCondition = "1900-01-01";
    }
    if (!endTime) {
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
    if (!!tagName) {
      tagNameCondition = `= '${tagName}'`;
      defaultTagNameCondition = "";
    }

    sql = `SELECT  ROW_NUMBER() OVER(ORDER BY idx) AS No, dong_code AS dongCode, ho_code AS hoCode, tag_id AS tagId, pos_desc AS posDesc, 
                                DATE_FORMAT(pos_update_date, '%Y-%m-%d %h:%i:%s') as posUpdateDate
           FROM t_parking_loc 
           WHERE (DATE(pos_update_date) >= '${defaultStartDateCondition} ${startTime}' AND DATE(pos_update_date) <= '${defaultEndDateCondition} ${endTime}')  
                 AND (dong_code ${defaultDongCondition} ${dongCondition} AND ho_code ${defaultHoCondition} ${hoCondition}) 
                 AND tag_name ${defaultTagNameCondition} ${tagNameCondition}`;

    const data = await pool.query(sql);
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

// 주차위치 정보 상세 조회
router.get("/getDetailedCarLocationList", async (req, res, next) => {
  let { idx = 0 } = req.query;
  console.log(idx);

  parkingDeatiledSQL = `SELECT dong_code AS dongCode, ho_code as hoCode, tag_id AS tagID, pos_desc AS posDesc, CONCAT("X: ", pos_x, " ", "Y: ",pos_y) AS POSITION,
                               floor_name AS floorName, building_name AS buildingName, DATE_FORMAT(pos_update_date, '%Y-%m-%d %h:%i:%s') AS posUpdateDate
                        FROM t_parking_loc
                        WHERE idx = ? `;
  const data = await pool.query(parkingDeatiledSQL, [idx]);
  let resultList = data[0];
  console.log(resultList);
  try {
    {
      let jsonResult = {
        resultCode: "00",
        resultMsg: "NORMAL_SERVICE",
        data: {
          items: resultList,
        },
      };
      return res.json(jsonResult);
    }
  } catch (error) {
    return res.status(500).json(error);
  }
});

module.exports = router;
