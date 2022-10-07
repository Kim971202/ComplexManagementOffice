const express = require("express");

const elvRouter = require("./routes/elvRouter");
const noticeRouter = require("./routes/noticeRouter");
const parkingRouter = require("./routes/parkingRouter");
const inoutCarRouter = require("./routes/inoutCarRouter");
const visitParkRouter = require("./routes/visitParkRouter");
const elecCarRouter = require("./routes/elecCarRouter");
const pacelRouter = require("./routes/parcelRouter");
const keyContractRouter = require("./routes/keyContractRouter");
const complaintRouter = require("./routes/complaintRouter");
const contractRouter = require("./routes/contractRouter");
const mngFeeRouter = require("./routes/managementFeeRouter");
const voteRouter = require("./routes/voteRouter");
const emsRouter = require("./routes/emsRouter");

const app = express();
const port = 3000; // 서버 포트번호

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/elv", elvRouter);
app.use("/notice", noticeRouter);
app.use("/parking", parkingRouter);
app.use("/inoutCar", inoutCarRouter);
app.use("/elecCar", elecCarRouter);
app.use("/parcel", pacelRouter);
app.use("/visitPark", visitParkRouter);
app.use("/keyContract", keyContractRouter);
app.use("/complaint", complaintRouter);
app.use("/contract", contractRouter);
app.use("/mng", mngFeeRouter);
app.use("/vote", voteRouter);
app.use("/ems", emsRouter);

// PDF 파일
app.use("/public/notice", express.static("public/notice/"));

app.listen(port, () => {
  console.log(`서버가 실행됩니다. http://localhost:${port}`);
});
