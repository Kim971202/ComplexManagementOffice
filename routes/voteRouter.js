const express = require("express");
const router = express.Router();
const pool = require("../DB/dbPool");

// 투표 목록 조회
router.get("/getVoteAgenda", async (req, res, next) => {
  let { startDate = "", endDate = "", voteEndFlag = "" } = req.query;
  console.log(startDate, endDate, voteEndFlag);

  try {
    let defaultValue = `LIKE '%'`;
    let defaultVoteEndFlag = defaultValue;

    let defaultStartDate = "";
    let defaultEndDate = "";

    let voteEndFlagCondition = "";

    if (!startDate) {
      defaultStartDate = "1900-01-01";
    }

    if (!endDate) {
      defaultEndDate = "3000-01-01";
    }

    if (!!voteEndFlag) {
      voteEndFlagCondition = `= '${voteEndFlag}'`;
      defaultVoteEndFlag = "";
    }

    const sql = `SELECT ROW_NUMBER() OVER(ORDER BY idx) AS No, DATE_FORMAT(v_start_dtime, '%Y-%m-%d %h:%s') AS vStartDTime, DATE_FORMAT(v_end_dtime, '%Y-%m-%d %h:%s') AS vEndDTime,
                        vote_rate AS voteRate, vote_end_flag AS vEndFlag, user_code AS userCode
                 FROM t_vote_agenda
                 WHERE (DATE(v_start_dtime) >= '${defaultStartDate} ${startDate}' AND DATE(v_start_dtime) <= '${defaultEndDate} ${endDate}') 
                       AND vote_end_flag ${defaultVoteEndFlag} ${voteEndFlagCondition}`;
    console.log("sql: " + sql);
    const data = await pool.query(sql);
    let resultList = data[0];
    let jsonResult = {
      resultList,
    };
    return res.json(jsonResult);
  } catch (error) {
    return res.status(500).json(error);
  }
});

module.exports = router;
