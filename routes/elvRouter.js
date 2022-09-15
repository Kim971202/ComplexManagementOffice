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

//입출차 리스트 조회
router.get("/getElevatorCallLog", async (req, res, next) => {
  let {
    serviceKey = "111111111", // 서비스 인증키
    numOfRows = 10, //           페이지 당 결과수
    pageNo = 1, //               페이지 번호
    doubleDataFlag = "Y", //     2배수 데이터 사용여부
    dongCode = "0000", //        동코드
    hoCode = "0000", //          호코드
    viewPeriod = "ALL", //       조회기간전체: (ALL)/일주일(1WEEK)/1개월(1MONTH)/3개월(3MONTH)
  } = req.query;

  console.log(
    serviceKey,
    numOfRows,
    pageNo,
    dongCode,
    hoCode,
    doubleDataFlag,
    viewPeriod
  );
  //http://localhost:3000/elv/getElevatorCallLog?serviceKey=22222&numOfRows=5&pageNo=2&dongCode=101&hoCode=101&doubleDataFlag=Y&viewPeriod=ALL

  let startDate = viewPeriodDate(viewPeriod);

  console.log("startDate : ", startDate);

  try {
    let sRow = (pageNo - 1) * numOfRows;
    //console.log("sRow = %d", sRow);
    //ex: 2page start = (2-1) * 10

    let size = numOfRows * (doubleDataFlag === "Y" ? 2 : 1);
    //console.log("size= %d", size);

    //     from t_elevator_control where dong_code = ? and ho_code = ? and control_req_dtime >= ?
    const sql = `select DATE_FORMAT(control_req_dtime, '%Y%m%d%h%i%s') as controlReqDTime, 
                      (
                        CASE WHEN comm_result = 'Y' THEN '성공'
                            ELSE '실패'
                        END
                      ) as  commResult,
                      direction
                 from t_elevator_control where dong_code = ? and ho_code = ? and control_req_dtime >= ?;`;

    console.log("sql=>" + sql);
    const data = await pool.query(sql, [
      dongCode,
      hoCode,
      startDate,
      Number(sRow),
      Number(size),
    ]);
    let resultList = data[0];

    const sql2 =
      "select count(*) as cnt from t_elevator_control where dong_code = ? and ho_code = ? and control_req_dtime >= ?";
    const data2 = await pool.query(sql2, [dongCode, hoCode, startDate]);

    let resultCnt = data2[0];

    console.log("resultList : ", resultList);
    // console.log("resultCnt[0].cnt : ", resultCnt[0].cnt);

    let jsonResult = {
      resultCode: "00",
      resultMsg: "NORMAL_SERVICE",
      numOfRows,
      pageNo,
      totalCount: resultCnt[0].cnt + "",
      doubleDataFlag,
      data: {
        dongCode,
        hoCode,
        viewPeriod,
        items: resultList,
      },
    };

    return res.json(jsonResult);
  } catch (err) {
    return res.status(500).json(err);
  }
});

module.exports = router;