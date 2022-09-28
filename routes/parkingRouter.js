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

// 주차위치 정보 삭제
router.delete("/deleteCarLocationList", async (req, res, next) => {
  let { idx = 0 } = req.body;
  console.log(idx);

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

// 입출차 정보 조회
router.get("/getParkingIOList", async (req, res, next) => {
  let {
    startTime = "",
    endTime = "",
    dongCode = "",
    hoCode = "",
    sendResult = "",
    carNo = "",
  } = req.query;
  console.log(startTime, endTime, dongCode, hoCode, sendResult, carNo);

  try {
    let defaultCondition = `LIKE '%'`;
    let defaultStartDateCondition = "";
    let defaultEndDateCondition = "";
    let defaultDongCondition = defaultCondition;
    let defaultHoCondition = defaultCondition;
    let defaultSendResultCondition = defaultCondition;
    let defaultCarNoCondition = defaultCondition;

    let dongCondition = "";
    let hoCondition = "";
    let sendResultCondition = "";
    let carNoCondition = "";

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
    if (!!sendResult) {
      sendResultCondition = `= '${sendResult}'`;
      defaultSendResultCondition = "";
    }
    if (!!carNo) {
      carNoCondition = `= '${carNo}'`;
      defaultCarNoCondition = "";
    }
    const sql = `SELECT ROW_NUMBER() OVER(ORDER BY idx) AS No, inout_dtime AS inoutDtime, 
                        inout_flag AS inoutFlag, dong_code AS dongCode, ho_code AS hoCode,
                        car_no AS carNo, send_time AS sendTime, send_result AS sendResult
                 FROM t_parking_io
                 WHERE (DATE(inout_dtime) >= '${defaultStartDateCondition} ${startTime}' AND DATE(inout_dtime) <= '${defaultEndDateCondition} ${endTime}')
                       AND (dong_code ${defaultDongCondition} ${dongCondition} AND ho_code ${defaultHoCondition} ${hoCondition})
                       AND send_result ${defaultSendResultCondition} ${sendResultCondition}
                       AND car_no ${defaultCarNoCondition} ${carNoCondition}`;
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

// 입출차 정보 삭제
router.delete("/deleteParkingIOList", async (req, res, next) => {
  let { idx = 0 } = req.body;
  console.log(idx);

  try {
    const sql = `DELETE FROM t_parking_io WHERE idx = ?`;
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

// 방문차량 목록 조회
router.get("/getParkingResv", async (req, res, next) => {
  let {
    startDate = "",
    endDate = "",
    dongCode = "",
    hoCode = "",
    inoutFlag = "",
    carNo = "",
  } = req.query;
  console.log(startDate, endDate, dongCode, hoCode, inoutFlag, carNo);

  try {
    let defaultCondition = `LIKE '%'`;
    let defaultDongCodeCondition = defaultCondition;
    let defaultHoCodeCondition = defaultCondition;
    let defaultInoutFlagCondition = defaultCondition;
    let defaultCarNoCondition = defaultCondition;

    let defaultStartDate = "";
    let defaultEndDate = "";

    let dongCodeCondition = "";
    let hoCodeCondition = "";
    let inoutFlagCondition = "";
    let carNoCondition = "";

    if (!startDate) {
      defaultStartDate = "1900-01-01";
    }
    if (!endDate) {
      defaultEndDate = "3000-01-01";
    }
    if (!!dongCode) {
      dongCodeCondition = `= '${dongCode}'`;
      defaultDongCodeCondition = "";
    }
    if (!!hoCode) {
      hoCodeCondition = `= '${hoCode}'`;
      defaultHoCodeCondition = "";
    }
    if (!!inoutFlag) {
      inoutFlagCondition = `= '${inoutFlag}'`;
      defaultInoutFlagCondition = "";
    }
    if (!!carNo) {
      carNoCondition = `= '${carNo}'`;
      defaultCarNoCondition = "";
    }

    let sql = `SELECT ROW_NUMBER() OVER(ORDER BY resv_no) AS No, dong_code AS dongCode, ho_code AS hoCode, car_no AS carNo, 
                      DATE_FORMAT(vis_start_date, '%Y-%m-%d') AS visStartDate,
                      DATE_FORMAT(vis_end_date, '%Y-%m-%d') AS visEndDate,
                      resv_method AS resvMethod,
                      inout_flag AS inoutFlag
               FROM t_parking_resv
               WHERE (DATE(vis_start_date) >= '${defaultStartDate} ${startDate}' AND (DATE(vis_end_date) <= '${defaultEndDate} ${endDate}'))
                     AND (dong_code ${defaultDongCodeCondition} ${dongCodeCondition} AND ho_code ${defaultHoCodeCondition} ${hoCodeCondition})
                     AND inout_flag ${defaultInoutFlagCondition} ${inoutFlagCondition}
                     AND car_no ${defaultCarNoCondition} ${carNoCondition}`;
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

// 방문차량 예약
router.post("/postParkingResv", async (req, res, next) => {
  let {
    visitDate = "",
    // 사용일수는 기본값으로 1일
    carNo = "",
    dongCode = "",
    hoCode = "",
  } = req.body;
  console.log(visitDate, carNo, dongCode, hoCode);

  try {
    let sql = `INSERT INTO t_parking_resv(vis_start_date, vis_end_date, car_no, resv_method, dong_code, ho_code, resv_flag, collect_dtime, inout_flag)
               VALUES(?,DATE_ADD(vis_start_date, INTERVAL 1 DAY),?,'W',?,?,'N',now(), 'N')`;
    console.log("sql: " + sql);
    const data = await pool.query(sql, [visitDate, carNo, dongCode, hoCode]);
    console.log(data[0]);
    let jsonResult = {
      resultCode: "00",
      resultMsg: "NORMAL_SERVICE",
    };
    return res.json(jsonResult);
  } catch (error) {
    return res.status(500).json(error);
  }
});

// 방문차량 삭제
router.delete("/deleteParkingResv", async (req, res, next) => {
  let { resvNo = 0 } = req.body;
  console.log(resvNo);

  try {
    const sql = `DELETE FROM t_parking_resv WHERE resv_no = ?`;
    console.log("sql: " + sql);
    const data = await pool.query(sql, [resvNo]);
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
