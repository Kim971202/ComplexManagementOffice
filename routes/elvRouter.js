var express = require("express");
var router = express.Router();
const pool = require("../DB/dbPool");
let {
  viewPeriodDate,
  addDays,
  isDate,
  strDateFormat,
  getDateOfMonthByFlag,
} = require("../modules/dataFunction");

// 엘리베이터 이력 조회
router.get("/getElevatorCallLog", async (req, res, next) => {
  let {
    startDate = "",
    endDate = "",
    reqMethod = "",
    elvDirection = "",
    commResult = "",
    dongCode = "",
    hoCode = "",
  } = req.query;

  console.log(
    startDate,
    endDate,
    reqMethod,
    elvDirection,
    commResult,
    dongCode,
    hoCode
  );

  try {
    let defaultCondition = `LIKE '%'`;

    let defaultReqMethodCondition = defaultCondition;
    let defaultElvDirectionCondition = defaultCondition;
    let defaultCommResultCondition = defaultCondition;
    let defaultDongCondition = defaultCondition;
    let defaultHoCondition = defaultCondition;

    let defaultStartDateCondition = "";
    let defaultEndDateCondition = "";

    let reqMethodCondition = "";
    let elvDirectionCondition = "";
    let commResultConditCondition = "";
    let dongCondition = "";
    let hoCondition = "";

    if (!startDate) {
      defaultStartDateCondition = "1900-01-01";
    }
    if (!endDate) {
      defaultEndDateCondition = "3000-01-01";
    }
    if (!!reqMethod) {
      reqMethodCondition = `= '${reqMethod}'`;
      defaultReqMethodCondition = "";
    }
    if (!!elvDirection) {
      elvDirectionCondition = `= '${elvDirection}'`;
      defaultElvDirectionCondition = "";
    }
    if (!!commResult) {
      commResultConditCondition = `= '${commResult}'`;
      defaultCommResultCondition = "";
    }
    if (!!dongCode) {
      dongCondition = `= '${dongCode}'`;
      defaultDongCondition = "";
    }
    if (!!hoCode) {
      hoCondition = `= '${hoCode}'`;
      defaultHoCondition = "";
    }

    const sql = `SELECT ROW_NUMBER() OVER(ORDER BY idx) AS No, DATE_FORMAT(control_req_dtime, '%Y-%m-%d %h:%i:%s') AS controlReqDTime, req_method AS reqMethod,
                        direction, dong_code AS dong_code, ho_code AS hoCode, DATE_FORMAT(comm_dtime, '%h:%i:%s') AS commDTime,
                        comm_result AS commResult
                 FROM t_elevator_control
                 WHERE (DATE(ev_arrive_time) >= '${defaultStartDateCondition} ${startDate}' AND DATE(ev_arrive_time) <= '${defaultEndDateCondition} ${endDate}') 
                       AND (dong_code ${defaultDongCondition} ${dongCondition} AND ho_code ${defaultHoCondition} ${hoCondition})
                       AND req_method ${defaultReqMethodCondition} ${reqMethodCondition} 
                       AND comm_result ${defaultCommResultCondition} ${commResultConditCondition}
                       AND direction ${defaultElvDirectionCondition} ${elvDirectionCondition}`;
    console.log("sql: " + sql);
    const data = await pool.query(sql);
    let resultList = data[0];
    console.log("resultList: " + resultList);
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

// 엘리베이터 이력 삭제
router.delete("/deleteElevatorCallLog", async (req, res, next) => {
  let { idx = 0 } = req.body;
  console.log(idx);

  try {
    const sql = `DELETE FROM t_elevator_control WHERE idx = ?`;
    console.log(sql);
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
