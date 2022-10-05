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
const { getVariables } = require("../modules/validationCheck");
const checkServiceKeyResult = require("../modules/authentication");

// 주차위치 정보 조회
router.get("/getParkingLocationList", async (req, res, next) => {
  let {
    serviceKey = "111111111", // 서비스 인증키
    numOfRows = 10, //           페이지 당 결과수
    pageNo = 1, //               페이지 번호
    dongCode = "", //        동코드
    hoCode = "", //          호코드
    startDate = "",
    endDate = "",
    tagName = "", // 차량번호
  } = req.query;

  console.log(
    serviceKey,
    numOfRows,
    pageNo,
    dongCode,
    hoCode,
    startDate,
    endDate,
    tagName
  );
  if ((await checkServiceKeyResult(serviceKey)) == false) {
    return res.json({
      resultCode: "30",
      resultMsg: "등록되지 않은 서비스키 입니다.",
    });
  }
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
    if (!!tagName) {
      tagNameCondition = `= '${tagName}'`;
      defaultTagNameCondition = "";
    }

    let sRow = (pageNo - 1) * numOfRows;
    let size = numOfRows * 1;

    const sql = `SELECT  ROW_NUMBER() OVER(ORDER BY idx) AS No, dong_code AS dongCode, ho_code AS hoCode, tag_id AS tagId, pos_desc AS posDesc, 
                                DATE_FORMAT(pos_update_date, '%Y-%m-%d %h:%i:%s') as posUpdateDate
                  FROM t_parking_loc 
                  WHERE (DATE(pos_update_date) >= '${defaultStartDateCondition} ${startDate}' AND DATE(pos_update_date) <= '${defaultEndDateCondition} ${endDate}')  
                        AND (dong_code ${defaultDongCondition} ${dongCondition} AND ho_code ${defaultHoCondition} ${hoCondition}) 
                        AND tag_name ${defaultTagNameCondition} ${tagNameCondition}
                        LIMIT ?,?`;

    const data = await pool.query(sql, [Number(sRow), Number(size)]);
    console.log("sql: " + sql);
    let resultList = data[0];

    const sql2 = `SELECT count(idx) as cnt
                  FROM t_parking_loc
                  WHERE (DATE(pos_update_date) >= '${defaultStartDateCondition} ${startDate}' AND DATE(pos_update_date) <= '${defaultEndDateCondition} ${endDate}')  
                        AND (dong_code ${defaultDongCondition} ${dongCondition} AND ho_code ${defaultHoCondition} ${hoCondition}) 
                        AND tag_name ${defaultTagNameCondition} ${tagNameCondition}`;
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

// 주차위치 정보 상세 조회
router.get("/getDetailedParkingLocationList", async (req, res, next) => {
  let { serviceKey = "", idx = 0 } = req.query;
  console.log(serviceKey, idx);

  parkingDeatiledSQL = `SELECT dong_code AS dongCode, ho_code as hoCode, tag_id AS tagID, pos_desc AS posDesc, CONCAT("X: ", pos_x, " ", "Y: ",pos_y) AS POSITION,
                               floor_name AS floorName, building_name AS buildingName, DATE_FORMAT(pos_update_date, '%Y-%m-%d %h:%i:%s') AS posUpdateDate
                        FROM t_parking_loc
                        WHERE idx = ? `;
  const data = await pool.query(parkingDeatiledSQL, [idx]);
  let resultList = data[0];
  console.log(resultList);
  if ((await checkServiceKeyResult(serviceKey)) == false) {
    return res.json({
      resultCode: "30",
      resultMsg: "등록되지 않은 서비스키 입니다.",
    });
  }
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

// 주차위치 정보 삭제
router.delete("/deleteParkingLocationList", async (req, res, next) => {
  let { serviceKey = "", idx = 0 } = req.body;
  console.log(serviceKey, idx);
  if ((await checkServiceKeyResult(serviceKey)) == false) {
    return res.json({
      resultCode: "30",
      resultMsg: "등록되지 않은 서비스키 입니다.",
    });
  }
  try {
    const sql = `DELETE FROM t_parking_loc WHERE idx = ?`;
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
