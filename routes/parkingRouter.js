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

// 주차위치 정보 전체 조회
router.get("/getALLCarLocationList", async (req, res, next) => {
  parkingALLSQL = `SELECT  ROW_NUMBER() OVER(ORDER BY idx) AS No, dong_code AS dongCode, ho_code AS hoCode, tag_id AS tagId, pos_desc AS posDesc, 
                           DATE_FORMAT(pos_update_date, '%Y-%m-%d-%h-%i-%s') as posUpdateDate
                   FROM t_parking_loc`;

  const data = await pool.query(parkingALLSQL);
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

// 주차위치 정보 검색 조회
router.get("/getSearchedCarLocationList", async (req, res, next) => {
  let {
    dongCode = "0000", //        동코드
    hoCode = "0000", //          호코드
    posDesc = "",
    viewPeriod = "ALL", //       조회기간전체: (ALL)/일주일(1WEEK)/1개월(1MONTH)/3개월(3MONTH)
  } = req.query;

  console.log(dongCode, hoCode, posDesc, viewPeriod);
  //http://localhost:3000/location/getLocationList?serviceKey=11111111&numOfRows=10&pageNo=1&doublDataFlag=Y&dongCode=101&hoCode=101&locFlag=FAMILY&viewPeriod=ALL
  let sDate = viewPeriodDate(viewPeriod);

  parkingSearchSQL = `SELECT  ROW_NUMBER() OVER(ORDER BY idx) AS No, dong_code AS dongCode, ho_code AS hoCode, tag_id AS tagId, pos_desc AS posDesc, 
                        DATE_FORMAT(pos_update_date, '%Y-%m-%d-%h-%i-%s') as posUpdateDate
                FROM t_parking_loc 
                WHERE DATE(pos_update_date) >= '${sDate}' AND (dong_code = ? OR ho_code = ? ) AND pos_desc = ?;`;
  const data = await pool.query(parkingSQL, [dongCode, hoCode, posDesc]);
  let resultList = data[0];
  console.log(resultList);
  try {
    {
      let jsonResult = {
        resultCode: "00",
        resultMsg: "NORMAL_SERVICE",
        data: {
          viewPeriod,
          items: resultList,
        },
      };
      return res.json(jsonResult);
    }
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
