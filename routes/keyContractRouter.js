const express = require("express");
const router = express.Router();
const pool = require("../DB/dbPool");

router.post("/postKeyContract", async (req, res, next) => {
  let {
    contactFlage = "",
    facilityName = "",
    phoneNum = "",
    memo = "",
  } = req.query;
  console.log(contactFlage, facilityName, phoneNum, memo);

  try {
    const sql = `INSERT INTO t_key_contact(phone_num, contact_flag, facility_name, memo, insert_dtime)
                 VALUES(?,?,?,?,now())`;
    const data = await pool.query(sql, [
      contactFlage,
      facilityName,
      phoneNum,
      memo,
    ]);
    console.log("data[0]=>" + data[0]);

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
