/**
 * 엑셀에서 입력 할때 한글로 되어있는 컬럼 이름들을 
 * 서버에서 받을때 내부적으로 parsing해주어야 함
 * 
 */

const multer  = require('multer');
const path = require('path');
const xlsx = require('xlsx');
const pool = require("/Users/donghyunkim/Desktop/complex/ComplexManagementOffice/DB/dbPool.js");
const express = require('express');
const app = express();
app.use(express.json({
    limit: '50mb' // 최대 50메가
  })); // 클라이언트 요청 body를 json으로 파싱 처리
  
  
  app.listen(3000, () => {
    // 3000번 포트로 웹 서버 실행
    console.log('Server started. port 3000.');
  });

  const sql = `insert into customers set ?`;


const storage = multer.diskStorage({  // 디스크 저장소 정의
    destination: function (req, file, cb) {
      cb(null, '/Users/donghyunkim/Desktop/complex/ComplexManagementOffice/xlsx/') // cb 콜백함수를 통해 전송된 파일 저장 디렉토리 설정
    },
    filename: function (req, file, cb) {
      // cb(null, file.originalname) // cb 콜백함수를 통해 전송된 파일 이름 설정
      cb(null, file.originalname); //시스템시간으로 파일 이름 설정
    }
  })
  const upload = multer({ storage: storage }); // multer 객체 생성
  app.post('/upload/customers', upload.single('xlsx'), function (req, res, next) {
    const workbook = xlsx.readFile(`/Users/donghyunkim/Desktop/complex/ComplexManagementOffice/xlsx/${req.file.filename}`); // 엑셀 파일 읽어오기
    const firstSheetName = workbook.SheetNames[0]; // 엑셀 파일의 첫번째 시트 이름 가져오기
    const firstSheet = workbook.Sheets[firstSheetName]; // 시트 이름을 사용해서 엑셀 파일의 첫번째 시트 가져오기
    
    const firstSheetJson = xlsx.utils.sheet_to_json(firstSheet); // utils.sheet_to_json 함수를 사용해서 첫번째 시트 내용을 json 데이터로 변환
    console.log(workbook);
    console.log(firstSheetName);
    console.log(firstSheetJson);
    let a = 'kim';
    firstSheetJson[0].name = a;
    console.log("firstSheetJson[0].name: " + firstSheetJson[0].name);

    firstSheetJson.forEach(async (customer) => {
      await pool.query(sql, customer);  // 고객 정보 데이터를 한건씩 읽으면서 MySQL 데이터베이스에 insert 처리
    })
    
    res.send('ok');
  });