const express = require("express");


const noticeRoute = require("./routes/notice-route");


const app = express();
const port = 3000; // 서버 포트번호

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/notice", noticeRoute);


app.listen(port, () => {
  console.log(`서버가 실행됩니다. http://localhost:${port}`);
});
