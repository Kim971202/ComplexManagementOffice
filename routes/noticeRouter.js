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
   startDate = "",
   endDate = "",
   notiType = "",
   sendResult = "",
   notiContent = ""
  } = req.query;

  console.log(
    startDate, endDate, notiType, sendResult, notiContent
  );

  try {    
    let defaultCondition = `LIKE '%'`;
    let defaultNotiTypeCondtion = defaultCondition;
    let defaultSendResultCondition = defaultCondition;
    let defaultNotiContentCondtion = defaultCondition;

    let notiTypeCondition = "";
    let sendResultCondition = "";
    let notiContentCondition = ""

    if(!startDate){
      let defaultStartDate = "1990-01-01";
    }
    if(!endDate){
      let defaultEndDate = "3000-01-01";
    }
    if(!!notiType){
      notiTypeCondition = `= '${notiType}'`
      defaultNotiTypeCondtion = "";
    }
    if(!!sendResult){
      sendResultCondition = `= ${sendResult}`
      defaultSendResultCondition = "";
    }
    if(!!notiContent){
      notiContentCondition = `= ${notiContent}`
      defaultNotiContentCondtion = ""
    }

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

    const sql = `SELECT ROW_NUMBER() OVER(ORDER BY idx) AS No, noti_type AS notiType, noti_title AS notiTitle, noti_owner AS notiOwner,
                        DATE_FORMAT(start_date, '%Y-%m-%d') AS startDate,
                        DATE_FORMAT(end_date, '%Y-%m-%d') AS endDate
                        send_result AS sendResult
                        FROM t_notice a
                        INNER JOIN t_notice_send b
                        WHERE a.idx = b.idx 
                              AND (DATE(start_date) >= '${defaultStartDate} ${startDate}' AND (DATE(end_date) <= '${defaultEndDate} ${endDate}'))
                              AND noti_type ${defaultCondition} ${notiTypeCondition}
                              AND send_result ${defaultCondition} ${sendResultCondition}
                              AND noti_content ${defaultNotiContentCondtion} ${notiContentCondition}`;
                              
    console.log("sql=>" + sql);
    console.log("notiType_=> " + notiType_);
    const data = await pool.query(sql, [notiType_, Number(sRow), Number(size)]);
    const checkingData = await pool.query(checkingSQL, [notiType_]);

    let result = checkingData[0];
    let resultList = data[0];

    const sql2 = `select count(a.idx) as cnt
                   from t_notice a
                   inner join  t_notice_send b 
                   where a.idx = b.idx and a.start_date <= now() and end_date >= now() and a.noti_type LIKE ?  ${tSQL};`;
    console.log("notiType_=> " + notiType_);
    const data2 = await pool.query(sql2);

    let jsonResult = {
      resultCode: "00",
      resultMsg: "NORMAL_SERVICE",
      data: {
        resultList,
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

    let countSQL = `SELECT ho_code AS hoCode, 
                    (SELECT COUNT(ho_code) AS hCount FROM t_dongho WHERE dong_code = ?) AS hCount 
                    FROM t_dongho WHERE dong_code = ?`;
    const countData = await pool.query(countSQL, [dongCode, dongCode]);
    console.log(countData[0])
    
    let getIdxSQL = `SELECT idx as idx FROM t_notice ORDER BY idx DESC LIMIT 1`;
    const getIdx = await pool.query(getIdxSQL);
    console.log("getIdx: " + getIdx[0][0].idx);

    let insertNoticeSendSQL = `INSERT INTO t_notice_send(idx, ho_code, dong_code, send_time, send_result)
                               VALUES(?,?,?,now(),'N')`;
                              
    if(notiType == "개별"){
      const noticeSendData = await pool.query(insertNoticeSendSQL, [
        getIdx[0][0].idx,
        hoCode,
        dongCode,
      ]);
    } else if (notiType == "전체"){
      for(i = 0; i < countData[0][0].hCount; i++){
        const notiData = await pool.query(insertNoticeSendSQL, [getIdx[0][0].idx, countData[0][i].hoCode, dongCode]);
      }
    }       


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
