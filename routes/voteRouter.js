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

// 투표 등록
router.post("/postVoteAgenda", async (req, res, next) => {
  let {
    voteTitle = "",
    voteDesc = "",
    vStartDTime = "",
    vEndDTime = "",
    itemContents = [],
  } = req.body;
  console.log(voteTitle, voteDesc, vStartDTime, vEndDTime, itemContents);

  try {
    let insertStartTime = vStartDTime + ":00:00";
    let insertEndTime = vEndDTime + ":00:00";

    const sql = `INSERT INTO t_vote_agenda(vote_title, vote_desc, v_start_dtime, v_end_dtime, insert_date,
                                           user_code, vote_end_flag, subjects_num, participation_num,
                                           vote_rate)
                 VALUES(?,?,?,?,now(),'tester', 'N', 0,0,0)`;
    console.log("sql: " + sql);
    const data = await pool.query(sql, [
      voteTitle,
      voteDesc,
      insertStartTime,
      insertEndTime,
    ]);

    let getIdxSQL = `SELECT idx as idx FROM t_vote_agenda ORDER BY idx DESC LIMIT 1`;
    const getIdx = await pool.query(getIdxSQL);
    console.log("getIdx: " + getIdx[0][0].idx);

    const itemsSQL = `INSERT INTO t_vote_items(item_no, idx, item_content, insert_date)
                      VALUES(?,?,?,now())`;
    console.log("itemsSQL: " + itemsSQL);
    for (i = 0; i < itemContents.length; ++i) {
      const data2 = await pool.query(itemsSQL, [
        i + 1,
        getIdx[0][0].idx,
        itemContents[i],
      ]);
    }

    let jsonResult = {
      resultCode: "00",
      resultMsg: "NORMAL_SERVICE",
    };
    return res.json(jsonResult);
  } catch (error) {
    return res.status(500).json(error);
  }
});

// 투표 수정: 단, 이미 시작된 투표는 수정 불가능
router.put("/updateVoteAgenda", async (req, res, next) => {
  let {
    idx = 0,
    voteTitle = "",
    voteDesc = "",
    vStartDTime = "",
    vEndDTime = "",
    itemContents = [],
    itemNo = [],
  } = req.body;
  console.log(
    idx,
    voteTitle,
    voteDesc,
    vStartDTime,
    vEndDTime,
    itemContents,
    itemNo
  );

  try {
    const sql = `SELECT DATE_FORMAT(v_start_dtime, '%Y-%m-%d %h') AS vsDtime FROM t_vote_agenda WHERE idx = ?`;
    console.log("sql: " + sql);
    const data = await pool.query(sql, [idx]);
    const timeSQL = `SELECT DATE_FORMAT(now(), '%Y-%m-%d %h:%i:%s') AS currTime`;
    const data2 = await pool.query(timeSQL);
    let compareTime = data[0][0].vsDtime + ":00:00";
    if (compareTime > data2[0][0].currTime) {
      return res.json({
        resultCode: "15",
        resultMSG: "진행중인 투표입니다.",
      });
    }

    const originSQL = `SELECT vote_title AS voteTitle, vote_desc AS voteDesc, DATE_FORMAT(v_start_dtime, '%Y-%m-%d %h') AS vsDtime, 
                              DATE_FORMAT(v_end_dtime, '%Y-%m-%d %h') AS veDtime, b.item_content AS itemContents,
                              b.item_no AS itemNo
                       FROM t_vote_agenda a 
                       INNER JOIN t_vote_items b
                       WHERE a.idx = ? AND b.idx = ? AND b.insert_date = b.insert_date`;
    console.log("originSQL: " + originSQL);
    const data3 = await pool.query(originSQL, [idx, idx]);
    console.log(data3[0][1]);
    let defaultVoteTitle = data3[0][0].voteTitle;
    let defaultVoteDesc = data3[0][0].voteDesc;
    let defaultVSDtime = data3[0][0].vsDtime;
    let defaultVEDtime = data3[0][0].veDtime;

    if (!!voteTitle) {
      defaultVoteTitle = voteTitle;
    }
    if (!!voteDesc) {
      defaultVoteDesc = voteDesc;
    }
    if (!!vStartDTime) {
      defaultVSDtime = vStartDTime;
    }
    if (!!vEndDTime) {
      defaultVEDtime = vEndDTime;
    }

    const updateSQL = `UPDATE t_vote_agenda a
                       INNER JOIN t_vote_items b
                       ON a.idx = b.idx
                       SET a.vote_title = ?, a.vote_desc = ?, a.v_start_dtime = ?, a.v_end_dtime = ?, b.item_content = ?
                       WHERE a.idx = ? AND b.item_no = ?`;
    console.log("updateSQL: " + updateSQL);
    for (i = 0; i < itemContents.length; ++i) {
      const data4 = await pool.query(updateSQL, [
        defaultVoteTitle,
        defaultVoteDesc,
        defaultVSDtime,
        defaultVEDtime,
        itemContents[i],
        idx,
        itemNo[i],
      ]);
    }

    let jsonResult = {
      resultCode: "00",
      resultMsg: "NORMAL_SERVICE",
    };
    return res.json(jsonResult);
  } catch (error) {
    return res.status(500).json(error);
  }
});

// 투표 삭제: 단, 이미 시작된 투표는 삭제 불가능
router.delete("/deleteVoteAgenda", async (req, res, next) => {
  let { idx = 0 } = req.body;
  console.log(idx);

  try {
    const sql = `SELECT DATE_FORMAT(v_start_dtime, '%Y-%m-%d %h') AS vsDtime FROM t_vote_agenda WHERE idx = ?`;
    console.log("sql: " + sql);
    const data = await pool.query(sql, [idx]);
    const timeSQL = `SELECT DATE_FORMAT(now(), '%Y-%m-%d %h:%i:%s') AS currTime`;
    const data2 = await pool.query(timeSQL);
    let compareTime = data[0][0].vsDtime + ":00:00";
    if (compareTime > data2[0][0].currTime) {
      return res.json({
        resultCode: "15",
        resultMSG: "진행중인 투표입니다.",
      });
    }

    const deleteItemSQL = `DELETE FROM t_vote_items WHERE idx = ?`;
    console.log("deleteItemSQL: " + deleteItemSQL);
    const data3 = await pool.query(deleteItemSQL, [idx]);

    const deleteAgendaSQL = `DELETE FROM t_vote_agenda WHERE idx = ?`;
    console.log("deleteAgendaSQL: " + deleteAgendaSQL);
    const data4 = await pool.query(deleteAgendaSQL, [idx]);

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
