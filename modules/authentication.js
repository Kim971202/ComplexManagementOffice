/**
 * 작성자: 사원 김동현
 * 작성일: 2022년09월06일
 * 수정일: 2022년09월07일
 * 파일설명: Redis의 key & value 속성을 이용하여 사용자의 servicekey를 인증하는 스크립트 이다.
 */
console.log("authentication.js called");
const redis = require("redis");
const util = require("util");
const redisInfo = {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  db: process.env.REDIS_DB,
  legacyMode: true,
};
const client = redis.createClient(redisInfo);
client.on("error", (err) => {
  console.error(err);
});

client.on("ready", () => {
  console.log("redis is ready to start");
});

// Redis 3.X 버전에서는 Promises관련 지원 없음 (4.X 버전부터 지원)
let getAsync = util.promisify(client.get).bind(client);

let result = "";
async function checkServiceKeyResult(serviceKey) {
  client.get(serviceKey, (err, value) => {
    result = value;
    console.log("value: " + value);
    if (!value) {
      console.log("Invalid ServiceKey has given");
    } else {
      console.log("Valid ServiceKey has given");
    }
  });
  try {
    let value = await getAsync(serviceKey);
    console.log(`use promisify: ${value}`);
    console.log(result);
    if (!result) {
      return false;
    } else {
      return true;
    }
  } catch (e) {
    console.log(`promisify error:`);
    console.log(e);
  }
}

//TODO: Set ServiceKey
module.exports = {
  checkServiceKeyResult,
};
