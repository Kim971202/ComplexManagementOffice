const express = require("express");
const router = express.Router();
const pool = require("../DB/dbPool");

// 공지사항 상세보기
router.get("/getDetailedNoticeList", async (req, res, next) => {
  let { idx = "" } = req.body;
  console.log(idx);
  try {
    const updateSQL = `UPDATE t_notice_send SET send_result = 'Y' WHERE idx = ?`;
    const updateSQLData = await pool.query(updateSQL, [idx]);
    console.log("updateSQLData: " + updateSQLData);

    const sql = `SELECT a.noti_title AS notiTitle, a.noti_content AS notiContent, 
                        DATE_FORMAT(a.start_date, '%Y-%m-%d %h:%m:%s') AS startDate, 
                        DATE_FORMAT(a.end_date, '%Y-%m-%d') AS endDate, 
                        b.send_result AS sendResult, a.noti_type AS notiType
                 FROM t_notice a
                 INNER JOIN t_notice_send b
                 WHERE a.idx = b.idx AND a.idx = ?`;
    const data = await pool.query(sql, [idx]);

    console.log("sql: " + sql);
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

// 공지사항 목록조회
router.get("/getNoticeList", async (req, res, next) => {
  let {
    serviceKey = "111111111", // 서비스 인증키
    numOfRows = 10, //           페이지 당 결과수
    pageNo = 1, //               페이지 번호
    doubleDataFlag = "Y", //     2배수 데이터 사용여부
    dongCode = "0000", //        동코드
    hoCode = "0000", //          호코드
    notiType = "ALL", //           공지타입 : 전체데이터(ALL), 전체공지(1), 세대 개별공지(2)
  } = req.query;

  console.log(
    serviceKey,
    numOfRows,
    pageNo,
    dongCode,
    hoCode,
    doubleDataFlag,
    notiType
  );
  //http://localhost:3000/notice/getNoticeList?serviceKey=22222&numOfRows=5&pageNo=2&dongCode=101&hoCode=101&doubleDataFlag=Y&notiType=ALL

  let resultCode = "00";

  if (serviceKey === "") resultCode = "10";
  if (numOfRows === "") resultCode = "10";
  if (pageNo === "") resultCode = "10";
  if (dongCode === "") resultCode = "10";
  if (hoCode === "") resultCode = "10";
  if (notiType === "") resultCode = "10";

  console.log("resulCode=> " + resultCode);
  if (resultCode !== "00") {
    return res.json({ resultCode: "01", resultMsg: "에러" });
  }

  try {
    let sRow = (pageNo - 1) * numOfRows;
    //console.log("sRow = %d", sRow);
    //ex: 2page start = (2-1) * 10

    let size = numOfRows * (doubleDataFlag === "Y" ? 2 : 1);
    //console.log("size= %d", size);

    let notiType_ = "%";
    if (notiType === "1") notiType_ = "전체";
    else if (notiType === "2") notiType_ = "개별";
    console.log("notiType_=> " + notiType_);

    const sql3 = `UPDATE t_notice a 
                    INNER JOIN t_notice_send b 
                    ON a.idx = b.idx
                    SET a.new_flag = IF (DATE_ADD(a.start_date, INTERVAL 3 DAY)  >=now(), 'Y', 'N')
                    WHERE a.idx = b.idx;`;
    const data3 = await pool.query(sql3);
    console.log("data3: " + data3);

    const tSQL =
      " and b.dong_code ='" + dongCode + "' and b.ho_code = '" + hoCode + "' ";

    const checkingSQL = `SELECT IFNULL(MAX(a.idx), 'NORESULT') AS RESULT
                         FROM t_notice a
                         INNER JOIN t_notice_send b 
                         WHERE a.idx = b.idx AND a.start_date <= now() AND end_date >= now() and a.noti_type LIKE ?  ${tSQL}
                         ;`;

    const sql = `select a.idx as idx, a.noti_type as notiType, a.noti_title as notiTitle, DATE_FORMAT(a.start_date, '%Y%m%d') as startDate, a.new_flag as newFlag
                   from t_notice a
                   inner join  t_notice_send b 
                   where  a.idx = b.idx and a.start_date <= now() and end_date >= now() and a.noti_type LIKE ?  ${tSQL}
                   limit ?, ?`;
    console.log("sql=>" + sql);
    console.log("notiType_=> " + notiType_);
    const data = await pool.query(sql, [notiType_, Number(sRow), Number(size)]);
    const checkingData = await pool.query(checkingSQL, [notiType_]);

    let result = checkingData[0];
    if (result[0].RESULT == "NORESULT") {
      return res.json({
        resultCode: "05",
        resultMsg: "없는데이터조회하였습니다.",
      });
    }
    let resultList = data[0];

    const sql2 = `select count(a.idx) as cnt
                   from t_notice a
                   inner join  t_notice_send b 
                   where a.idx = b.idx and a.start_date <= now() and end_date >= now() and a.noti_type LIKE ?  ${tSQL};`;
    //const sql2 = "select count(*) as cnt from t_notice where noti_type = ?";
    console.log("notiType_=> " + notiType_);
    const data2 = await pool.query(sql2, [notiType_]);
    let resultCnt = data2[0];

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
        notiType,
        items: resultList,
      },
    };
    // console.log(resultList);

    return res.json(jsonResult);
  } catch (err) {
    return res.status(500).json(err);
  }
});

// 공지사항 등록 (개별, 전체)
router.post("/postNotice", async (req, res, next) => {
  let {
    dongCode = "", //     동코드
    hoCode = "", //       호코드
    notiType = "", //     공지 타입
    notiTitle = "", //    공지 제목
    notiContent = "", //  공지 내용
    startDate = "", //    공지 시작일
    endDate = "", //      공지 종료일
    notiOwer = "", //     공지 주체
  } = req.body;
  console.log(
    dongCode,
    hoCode,
    notiType,
    notiTitle,
    notiContent,
    startDate,
    endDate,
    notiOwer
  );
  try {
    let countSQL = `SELECT COUNT(ho_code) AS hCount FROM t_dongho WHERE dong_code = ?;`;
    const countData = await pool.query(countSQL, [dongCode]);

    console.log(countData[0][0].hCount);

    let sql = `INSERT INTO t_notice(noti_type, noti_title, noti_content, start_date, end_date, noti_owner, insert_date, user_id, new_flag)
               VALUES(?,?,?,DATE_FORMAT(?,"%y-%m-%d"),DATE_FORMAT(?,"%y-%m-%d"),?,now(),'8888','N')`;
    console.log("sql=>" + sql);
    const data = await pool.query(sql, [
      notiType,
      notiTitle,
      notiContent,
      startDate,
      endDate,
      notiOwer,
    ]);
    console.log(data[0]);
    let getIdxSQL = `SELECT idx as idx FROM t_notice WHERE start_date = ? AND end_date = ? `;
    const getIdx = await pool.query(getIdxSQL, [startDate, endDate]);
    console.log("getIdx: " + getIdx[0][0].idx);

    let insertNoticeSendSQL = `INSERT INTO t_notice_send(idx, ho_code, dong_code, send_time, send_result)
                               VALUES(?,?,?,now(),'N')`;
    const noticeSendData = await pool.query(insertNoticeSendSQL, [
      getIdx[0][0].idx,
      hoCode,
      dongCode,
    ]);

    let jsonResult = {
      resultCode: "00",
      resultMsg: "NORMAL_SERVICE",
    };

    return res.json(jsonResult);
  } catch (err) {
    console.log("test===============" + err);
    return res.status(500).json(err);
  }
});

module.exports = router;
