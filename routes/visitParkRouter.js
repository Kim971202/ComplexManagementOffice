const express = require("express");
const router = express.Router();
const pool = require("../DB/dbPool");

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

// 방문차량 상세 보기
router.get("/getDetailedParkingResv", async (req, res, next) => {
  let { resvNo = 0 } = req.query;
  console.log(resvNo);

  try {
    const sql = `SELECT DATE_FORMAT(a.vis_start_date, '%Y-%m-%d') AS visStartDate, DATE_FORMAT(a.vis_end_date, '%Y-%m-%d') AS visEndDate,
                        a.car_no AS carNo, CONCAT(a.dong_code, " - ", a.ho_code) AS booker, DATE_FORMAT(b.insert_dtime, '%Y-%m-%d %h:%i:%s') AS insertDTime,
                        a.resv_method AS resvMethod, DATE_FORMAT(a.collect_dtime, '%Y-%m-%d %h:%i:%s') AS collectDtime
                 FROM t_parking_resv a
                 INNER JOIN t_parking_resv_his b
                 WHERE a.resv_no = b.resv_no AND a.resv_no = ?;`;
    console.log("sql: " + sql);
    const data = await pool.query(sql, [resvNo]);
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
    const sql = `INSERT INTO t_parking_resv(vis_start_date, vis_end_date, car_no, resv_method, dong_code, ho_code, resv_flag, collect_dtime, inout_flag)
                 VALUES(?,DATE_ADD(vis_start_date, INTERVAL 1 DAY),?,'W',?,?,'N',now(), 'N')`;
    console.log("sql: " + sql);
    const data = await pool.query(sql, [visitDate, carNo, dongCode, hoCode]);
    console.log(data[0]);

    const getIdxSQL = `SELECT resv_no as idx FROM t_parking_resv ORDER BY idx DESC LIMIT 1`;
    const getIdx = await pool.query(getIdxSQL);
    console.log("getIdx: " + getIdx[0][0].idx);

    const sql1 = `INSERT INTO t_parking_resv_his(insert_dtime, resv_no, vis_start_date, vis_end_date, car_no, resv_method, dong_code, ho_code, resv_flag, collect_dtime, inout_flag)
                 VALUES(now(),?,?,DATE_ADD(vis_start_date, INTERVAL 1 DAY),?,'W',?,?,'N',now(), 'N')`;
    console.log("sql1: " + sql1);
    const data1 = await pool.query(sql1, [
      getIdx[0][0].idx,
      visitDate,
      carNo,
      dongCode,
      hoCode,
    ]);
    console.log(data1[0]);

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
