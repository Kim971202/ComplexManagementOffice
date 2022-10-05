const express = require("express");
const router = express.Router();
const pool = require("../DB/dbPool");
const checkServiceKeyResult = require("../modules/authentication");

// 방문차량 목록 조회
router.get("/getParkingResv", async (req, res, next) => {
  let {
    serviceKey = "111111111", // 서비스 인증키
    numOfRows = 10, //           페이지 당 결과수
    pageNo = 1, //               페이지 번호
    startDate = "",
    endDate = "",
    dongCode = "",
    hoCode = "",
    inoutFlag = "",
    carNo = "",
  } = req.query;
  console.log(
    serviceKey,
    numOfRows,
    pageNo,
    startDate,
    endDate,
    dongCode,
    hoCode,
    inoutFlag,
    carNo
  );
  if ((await checkServiceKeyResult(serviceKey)) == false) {
    return res.json({
      resultCode: "30",
      resultMsg: "등록되지 않은 서비스키 입니다.",
    });
  }
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
      carNoCondition = `LIKE '${carNo}%'`;
      defaultCarNoCondition = "";
    }

    let sRow = (pageNo - 1) * numOfRows;
    let size = numOfRows * 1;

    let sql = `SELECT ROW_NUMBER() OVER(ORDER BY resv_no) AS No, dong_code AS dongCode, ho_code AS hoCode, car_no AS carNo, 
                        DATE_FORMAT(vis_start_date, '%Y-%m-%d') AS visStartDate,
                        DATE_FORMAT(vis_end_date, '%Y-%m-%d') AS visEndDate,
                        resv_method AS resvMethod,
                        inout_flag AS inoutFlag
                 FROM t_parking_resv
                 WHERE (DATE(vis_start_date) >= '${defaultStartDate} ${startDate}' AND (DATE(vis_end_date) <= '${defaultEndDate} ${endDate}'))
                       AND (dong_code ${defaultDongCodeCondition} ${dongCodeCondition} AND ho_code ${defaultHoCodeCondition} ${hoCodeCondition})
                       AND inout_flag ${defaultInoutFlagCondition} ${inoutFlagCondition}
                       AND car_no ${defaultCarNoCondition} ${carNoCondition}
                       LIMIT ?,?`;
    console.log("sql: " + sql);
    const data = await pool.query(sql, [Number(sRow), Number(size)]);
    let resultList = data[0];

    const sql2 = `SELECT count(resv_no) as cnt
                  FROM t_parking_resv
                  WHERE (DATE(vis_start_date) >= '${defaultStartDate} ${startDate}' AND (DATE(vis_end_date) <= '${defaultEndDate} ${endDate}'))
                  AND (dong_code ${defaultDongCodeCondition} ${dongCodeCondition} AND ho_code ${defaultHoCodeCondition} ${hoCodeCondition})
                  AND inout_flag ${defaultInoutFlagCondition} ${inoutFlagCondition}
                  AND car_no ${defaultCarNoCondition} ${carNoCondition}`;
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

// 방문차량 상세 보기
router.get("/getDetailedParkingResv", async (req, res, next) => {
  let { serviceKey = "", resvNo = 0 } = req.query;
  console.log(serviceKey, resvNo);
  if ((await checkServiceKeyResult(serviceKey)) == false) {
    return res.json({
      resultCode: "30",
      resultMsg: "등록되지 않은 서비스키 입니다.",
    });
  }
  try {
    const sql = `SELECT DATE_FORMAT(a.vis_start_date, '%Y-%m-%d') AS visStartDate, DATE_FORMAT(a.vis_end_date, '%Y-%m-%d') AS visEndDate,
                        a.car_no AS carNo, CONCAT(a.dong_code, " - ", a.ho_code) AS booker, DATE_FORMAT(b.insert_dtime, '%Y-%m-%d %h:%i:%s') AS insertDTime,
                        a.resv_method AS resvMethod, inout_flag AS inoutFlag
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
  if ((await checkServiceKeyResult(serviceKey)) == false) {
    return res.json({
      resultCode: "30",
      resultMsg: "등록되지 않은 서비스키 입니다.",
    });
  }
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
  let { serviceKey = "", resvNo = 0 } = req.body;
  console.log(serviceKey, resvNo);
  if ((await checkServiceKeyResult(serviceKey)) == false) {
    return res.json({
      resultCode: "30",
      resultMsg: "등록되지 않은 서비스키 입니다.",
    });
  }
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

// resv_flag: 예약취소구분 N : 예약 중, Y : 예약 취소
router.put("/updateParkingResv", async (req, res, next) => {
  let { resvNo = 0, resvStatus = "" } = req.body;
  console.log(resvNo, resvStatus);
  if ((await checkServiceKeyResult(serviceKey)) == false) {
    return res.json({
      resultCode: "30",
      resultMsg: "등록되지 않은 서비스키 입니다.",
    });
  }
  try {
    const sql = `UPDATE t_parking_resv SET resv_flag = ? WHERE resv_no = ?`;
    console.log("sql: " + sql);
    const data = await pool.query(sql, [resvStatus, resvNo]);
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

module.exports = router;
