const express = require("express");
const router = express.Router();
const pool = require("../DB/dbPool");

// 관리비 조회
router.get("/getMngFeeList", async (req, res, next) => {
  let { dongCode = "", hoCode = "", hAreaType = "" } = req.query;
  console.log(dongCode, hoCode, hAreaType);

  try {
    let defaultCondition = `LIKE '%'`;
    let defaultDongCondition = defaultCondition;
    let defaultHoCondition = defaultCondition;
    let defaultAreaCondition = defaultCondition;

    let dongCondition = "";
    let hoCondition = "";
    let areaCondition = "";

    if (!!dongCode) {
      dongCondition = `= '${dongCode}'`;
      defaultDongCondition = "";
    }
    if (!!hoCode) {
      hoCondition = `= '${hoCode}'`;
      defaultHoCondition;
    }
    if (!!hAreaType) {
      areaCondition = `= '${hAreaType}'`;
      defaultAreaCondition = "";
    }

    const sql = `SELECT ROW_NUMBER() OVER(ORDER BY insert_date) AS No, a.dong_code AS dongCode, a.ho_code AS hoCode, b.h_area_type AS hAreaType, 
                        CONCAT(mng_year, "-",mng_month) AS payMonth, a.total_mng AS totalMng
                 FROM t_management_fee a
                 INNER JOIN t_dongho b
                 WHERE (a.dong_code = b.dong_code AND a.ho_code = b.ho_code)
                       AND (a.dong_code ${defaultDongCondition} ${dongCondition} AND a.ho_code  ${defaultHoCondition} ${hoCondition})
                       AND b.h_area_type ${defaultAreaCondition} ${areaCondition};`;
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

// 관리비 수정
// TODO: excel 추가시 excel 파일로 변경가능하게 구현

// 관리비 삭제
router.delete("/deleteMngFeeList", async (req, res, next) => {
  let { dongCode = "", hoCode = "" } = req.body;
  console.log(dongCode.hoCode);

  try {
    const sql = `DELETE FROM t_management_fee WHERE dong_code = ? AND ho_code = ?`;
    console.log("sql: " + sql);
    const data = await pool.query(sql, [dongCode, hoCode]);
    let jsonResult = {
      resultCode: "00",
      resultMsg: "NORMAL_SERVICE",
    };
    return res.json(jsonResult);
  } catch (error) {
    return res.status(500).json(error);
  }
});

// 관리비 등록

module.exports = router;
