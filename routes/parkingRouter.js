const express = require("express");
const router = express.Router();
const pool = require("../DB/dbPool");

// 주차위치 정보 전체 조회
router.get("/getALLCarLocationList", async (req, res, next) => {
    let {
        serviceKey = "111111111", // 서비스 인증키
        numOfRows = 10, //           페이지 당 결과수
        pageNo = 1, //               페이지 번호
        doubleDataFlag = "Y", //     2배수 데이터 사용여부
        dongCode = "0000", //        동코드
        hoCode = "0000", //          호코드
        locFlag = "PARKING", //      위치구분: 가족위치(FAMILY)/주차위치(PARKING)
        viewPeriod = "ALL", //       조회기간전체: (ALL)/일주일(1WEEK)/1개월(1MONTH)/3개월(3MONTH)
      } = req.query;
    
      console.log(
        serviceKey,
        numOfRows,
        pageNo,
        dongCode,
        hoCode,
        doubleDataFlag,
        locFlag,
        viewPeriod
      );
      //http://localhost:3000/location/getLocationList?serviceKey=11111111&numOfRows=10&pageNo=1&doublDataFlag=Y&dongCode=101&hoCode=101&locFlag=FAMILY&viewPeriod=ALL
      let sDate = viewPeriodDate(viewPeriod);

      let loc_tb = "";
      let fSQL = "";
      fSQL = `select  idx, 
              tag_id as tagId, tag_name as tagName, tag_desc as tagDesc, pos_desc as posDesc,
              floor_name as floorName, building_name as buildingName, pos_x as posX, pos_y as posY, '' as imgURL,
              DATE_FORMAT(pos_update_date, '%Y%m%d%h%i%s') as posUpdateDate
              from t_parking_loc 
              where pos_update_date >= '${sDate}' and dong_code = ? and ho_code = ?`;

loc_tb = "t_parking_loc";    
    try{{

    }}catch(error){

    }
});

module.exports = router;
