const express = require("express");


const elvRouter = require("./routes/elvRouter");


const app = express();
const port = 3000; // 서버 포트번호

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/elv", elvRouter);


app.listen(port, () => {
  console.log(`서버가 실행됩니다. http://localhost:${port}`);
});
