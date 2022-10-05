const express = require("express");
const router = express.Router();
const pool = require("../DB/dbPool");
const { upload, checkUploadType } = require("../modules/fileUpload");
const { getServerIp } = require("../modules/ipSearch");

// 공지사항 목록조회
router.get("/getNoticeList", async (req, res, next) => {
  let {
    startDate = "",
    endDate = "",
    notiType = "",
    sendResult = "",
    notiContent = "",
  } = req.query;

  console.log(startDate, endDate, notiType, sendResult, notiContent);

  try {
    let defaultCondition = `LIKE '%'`;
    let defaultNotiTypeCondtion = defaultCondition;
    let defaultSendResultCondition = defaultCondition;
    let defaultNotiContentCondtion = defaultCondition;

    let defaultStartDate = "";
    let defaultEndDate = "";

    let notiTypeCondition = "";
    let sendResultCondition = "";
    let notiContentCondition = "";

    if (!startDate) {
      defaultStartDate = "1990-01-01";
    }
    if (!endDate) {
      defaultEndDate = "3000-01-01";
    }
    if (!!notiType) {
      notiTypeCondition = `= '${notiType}'`;
      defaultNotiTypeCondtion = "";
    }
    if (!!sendResult) {
      sendResultCondition = `= ${sendResult}`;
      defaultSendResultCondition = "";
    }
    if (!!notiContent) {
      notiContentCondition = `= ${notiContent}`;
      defaultNotiContentCondtion = "";
    }

    const sql3 = `UPDATE t_notice a
                    INNER JOIN t_notice_send b
                    ON a.idx = b.idx
                    SET a.new_flag = IF (DATE_ADD(a.start_date, INTERVAL 3 DAY)  >=now(), 'Y', 'N')
                    WHERE a.idx = b.idx;`;
    const data3 = await pool.query(sql3);

    const sql = `SELECT ROW_NUMBER() OVER(ORDER BY a.idx) AS No, a.noti_type AS notiType, a.noti_title AS notiTitle, a.noti_owner AS notiOwner,
                        DATE_FORMAT(a.start_date, '%Y-%m-%d') AS startDate,
                        DATE_FORMAT(a.end_date, '%Y-%m-%d') AS endDate,
                        b.send_result AS sendResult
                        FROM t_notice a
                        INNER JOIN t_notice_send b
                        WHERE a.idx = b.idx 
                              AND (DATE(a.start_date) >= '${defaultStartDate} ${startDate}' AND (DATE(a.end_date) <= '${defaultEndDate} ${endDate}'))
                              AND a.noti_type ${defaultNotiTypeCondtion} ${notiTypeCondition}
                              AND b.send_result ${defaultSendResultCondition} ${sendResultCondition}
                              AND a.noti_content ${defaultNotiContentCondtion} ${notiContentCondition}
                        LIMIT 15`;

    console.log("sql=>" + sql);
    const data = await pool.query(sql);
    let resultList = data[0];

    let jsonResult = {
      resultCode: "00",
      resultMsg: "NORMAL_SERVICE",
      data: {
        resultList,
      },
    };
    console.log(resultList);
    return res.json(jsonResult);
  } catch (err) {
    return res.status(500).json(err);
  }
});

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
    let test = data[0];
    console.log(typeof test[0].endDate);
    console.log(test[0].endDate.length);

    let myTime = new Date();
    let mySeconds = myTime.getSeconds();
    console.log(typeof mySeconds.length);
    // if(mySeconds.length)
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

// 공지사항 등록 (개별, 전체)
router.post("/postNotice", upload.single("file"), async (req, res, next) => {
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

  checkUploadType(2);

  let fileName = req.file.originalname;
  let filePath =
    `http://${getServerIp()}:3000/` + req.file.destination + fileName;
  try {
    let sql = `INSERT INTO t_notice(noti_type, noti_title, noti_content, start_date, end_date, noti_owner, insert_date, user_id, new_flag, file_path, file_name)
               VALUES(?,?,?,DATE_FORMAT(?,"%y-%m-%d"),DATE_FORMAT(?,"%y-%m-%d"),?,now(),'8888','N', ?, ?)`;
    console.log("sql=>" + sql);
    const data = await pool.query(sql, [
      notiType,
      notiTitle,
      notiContent,
      startDate,
      endDate,
      notiOwer,
      filePath,
      fileName,
    ]);

    let countSQL = `SELECT ho_code AS hoCode, (SELECT COUNT(ho_code) AS hCount FROM t_dongho WHERE dong_code = ?) AS hCount 
                    FROM t_dongho WHERE dong_code = ?`;
    console.log("countSQL: " + countSQL);
    const countData = await pool.query(countSQL, [dongCode, dongCode]);
    console.log(countData[0]);

    let getIdxSQL = `SELECT idx as idx FROM t_notice ORDER BY idx DESC LIMIT 1`;
    const getIdx = await pool.query(getIdxSQL);
    console.log("getIdx: " + getIdx[0][0].idx);

    let insertNoticeSendSQL = `INSERT INTO t_notice_send(idx, ho_code, dong_code, send_time, send_result)
                               VALUES(?,?,?,now(),'N')`;

    if (notiType == "개별") {
      const noticeSendData = await pool.query(insertNoticeSendSQL, [
        getIdx[0][0].idx,
        hoCode,
        dongCode,
      ]);
    } else if (notiType == "전체") {
      for (i = 0; i < countData[0][0].hCount; i++) {
        const notiData = await pool.query(insertNoticeSendSQL, [
          getIdx[0][0].idx,
          countData[0][i].hoCode,
          dongCode,
        ]);
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

// 공지사항 수정
router.put("/updateNotice", upload.single("file"), async (req, res, next) => {
  let { idx = 0, notiTitle = "", notiContent = "" } = req.body;
  console.log(idx, notiTitle, notiContent);
  checkUploadType(2);
  try {
    // 월패드 알림이 Y 이면 수정 불가
    const checkNotiTypeSQL = `SELECT send_result AS sendResult FROM t_notice_send WHERE idx = ?`;
    console.log("checkNotiTypeSQL: " + checkNotiTypeSQL);
    const data = await pool.query(checkNotiTypeSQL, [idx]);
    console.log(data[0][0].sendResult);
    if (data[0][0].sendResult === "Y") {
      return res.json({
        resultCode: "08",
        resultMsg: "이미 등록된 공지사항 입니다.",
      });
    }

    // 파일이 없을 경우 기존과 동일하게 진행
    if (!req.file) {
      console.log("no file selected");
    } else if (req.file.originalname !== data[0][0].fileName) {
      // TODO: 파일 경로, 파일명만 해당 idx에 row에서 수정 한다
      let fileName = req.file.originalname;
      let filePath =
        `http://${getServerIp()}:3000/` + req.file.destination + fileName;
      const sql = `UPDATE t_notice SET noti_title = ?, noti_content = ?, file_path = ?, file_name = ? WHERE idx = ?`;
      const data = await pool.query(sql, [
        notiTitle,
        notiContent,
        filePath,
        fileName,
        idx,
      ]);
      let jsonResult = {
        resultCode: "00",
        resultMsg: "NORMAL_SERVICE",
      };
      return res.json(jsonResult);
    }
    const sql = `UPDATE t_notice SET noti_title = ?, noti_content = ? WHERE idx = ?`;
    console.log("sql: " + sql);
    const data2 = await pool.query(sql, [notiTitle, notiContent, idx]);

    let jsonResult = {
      resultCode: "00",
      resultMsg: "NORMAL_SERVICE",
    };
    return res.json(jsonResult);
  } catch (error) {
    return res.status(500).json(error);
  }
});

// 공지사항 삭제
router.delete("/deleteNotice", async (req, res) => {
  let { idx = 0 } = req.body;
  console.log(idx);

  try {
    // 월패드 알림이 Y 이면 삭제 불가
    const checkNotiTypeSQL = `SELECT send_result AS sendResult FROM t_notice_send WHERE idx = ?`;
    console.log("checkNotiTypeSQL: " + checkNotiTypeSQL);
    const data = await pool.query(checkNotiTypeSQL, [idx]);
    console.log(data[0][0].sendResult);
    if (data[0][0].sendResult === "Y") {
      return res.json({
        resultCode: "08",
        resultMsg: "이미 등록된 공지사항 입니다.",
      });
    }

    const sql = `DELETE FROM t_notice_send WHERE idx = ?`;
    console.log("sql: " + sql);
    const data2 = await pool.query(sql, [idx]);

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

// const tSQL =
//   " and b.dong_code ='" + dongCode + "' and b.ho_code = '" + hoCode + "' ";

// const checkingSQL = `SELECT IFNULL(MAX(a.idx), 'NORESULT') AS RESULT
//                      FROM t_notice a
//                      INNER JOIN t_notice_send b
//                      WHERE a.idx = b.idx AND a.start_date <= now() AND end_date >= now() and a.noti_type LIKE ?  ${tSQL}
//                      ;`;
