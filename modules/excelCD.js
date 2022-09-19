const xlsx = require("xlsx");
const workBook = xlsx.readFile("./xlxs/shit.xlsx");
const fileSheetName = workBook.SheetNames[0];
const firstSheet = workBook.Sheets[fileSheetName];

const firstSheetJson = xlsx.utils.sheet_to_json(firstSheet);

console.log(firstSheetJson);
