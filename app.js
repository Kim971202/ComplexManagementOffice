const express = require("express");

const elvRouter = require("./routes/elvRouter");
const noticeRouter = require("./routes/noticeRouter");
const parkingRouter = require("./routes/parkingRouter");
const elecCarRouter = require("./routes/elecCarRouter");
const pacelRouter = require("./routes/parcelRouter");
const contractRouter = require("./routes/keyContractRouter");

const app = express();
const port = 3000; // 서버 포트번호

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/elv", elvRouter);
app.use("/notice", noticeRouter);
app.use("/parking", parkingRouter);
app.use("/elecCar", elecCarRouter);
app.use("/parcel", pacelRouter);
app.use("/contract", contractRouter);

app.listen(port, () => {
  console.log(`서버가 실행됩니다. http://localhost:${port}`);
});
