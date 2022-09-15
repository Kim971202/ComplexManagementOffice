function getDateStr(myDate) {
    var year = myDate.getFullYear();
    var month = myDate.getMonth() + 1;
    var day = myDate.getDate();
  
    month = month < 10 ? "0" + String(month) : month;
    day = day < 10 ? "0" + String(day) : day;
  
    return year + "-" + month + "-" + day;
  }
  
  function viewPeriodDate(viewPeriod) {
    let now = new Date(); // 현재 날짜 및 시간
    let startDate;
    // 일주일 전
    if (viewPeriod === "1WEEK")
      startDate = getDateStr(new Date(now.setDate(now.getDate() - 7)));
    // 1개월 전
    else if (viewPeriod === "1MONTH")
      startDate = getDateStr(new Date(now.setMonth(now.getMonth() - 1)));
    // 3개월 전
    else if (viewPeriod === "3MONTH")
      startDate = getDateStr(new Date(now.setMonth(now.getMonth() - 3)));
    // 전체(ALL)
    else startDate = getDateStr(new Date(now.setYear(now.getYear() - 50)));
  
    return startDate;
  }
  
  //일수 더하는 함수
  function addDays(date, days) {
    const clone = new Date(date);
    clone.setDate(date.getDate() + Number(days));
  
    return getDateStr(clone);
  }
  
  //yyyyMMdd형태의 문자열로 날짜계산
  function strAddDays(strDate, days) {
    let strDateFormat_ = strDate;
    // let strDateFormat_= strDateFormat(strDate);
  
    const t_date = new Date(strDateFormat_);
    return addDays(t_date, Number(days));
  }
  
  //yyyyMMdd형태의 문자열을 날짜형식 문자열로
  function strDateFormat(strDate) {
    let strDateFormat =
      strDate.substr(0, 4) +
      "-" +
      strDate.substr(4, 2) +
      "-" +
      strDate.substr(6, 2);
    return strDateFormat;
  }
  
  //월의 1일, 말일
  //dayFlag => 0: 전월 말일, 1: 금월 1일, 2: 금월 말일, 3: 익월 1일, 나머지는 오늘날짜
  function getDateOfMonthByFlag(pDate, dayFlag) {
    let date = new Date(pDate);
  
    if (dayFlag === 0) date = new Date(date.getFullYear(), date.getMonth(), 0);
    else if (dayFlag === 1)
      date = new Date(date.getFullYear(), date.getMonth(), 1);
    else if (dayFlag === 2)
      date = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    else if (dayFlag === 3)
      date = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  
    console.log("date=>" + getDateStr(date));
  
    return getDateStr(date);
  }
  
  /**날짜 문자열 유효성 검증 함수
    input type => yyyymmdd, yyyy-mm-dd, yyyy/mm/dd
    output => 0: 정상, 1: 해당월의 날짜 넘음, 2: 존재하지 않는 달, 3: 포맷 안맞음, 4: -인 날짜
  */
  function isDate(yyyymmdd) {
    var y, m, d;
  
    if (yyyymmdd.length == 8) {
      if (!yyyymmdd.match(/[0-9]{8}/g)) return 3;
      y = yyyymmdd.substring(0, 4);
      m = yyyymmdd.substring(4, 6);
      d = yyyymmdd.substring(6, 8);
    } else if (yyyymmdd.length == 10) {
      if (!yyyymmdd.match(/[0-9]{4}[-/][0-9]{2}[-/][0-9]{2}/g)) return 3;
  
      y = yyyymmdd.split("-")[0];
      m = yyyymmdd.split("-")[1];
      d = yyyymmdd.split("-")[2];
    } else {
      return 3;
    }
  
    var limit_day;
    switch (eval(m)) {
      case 1:
      case 3:
      case 5:
      case 7:
      case 8:
      case 10:
      case 12:
        limit_day = 31;
        break;
      case 2:
        if ((y - 2008) % 4 == 0) limit_day = 29;
        else limit_day = 28;
        break;
      case 4:
      case 6:
      case 9:
      case 11:
        limit_day = 30;
        break;
      default:
        return 2;
        break;
    }
    if (eval(d) > limit_day) {
      return 1;
    }
    if (eval(d) < 1) {
      return 4;
    }
    return 0;
  }
  //han288.tistory.com/10 [사이트 구축/최적화 활용 팁:티스토리]
  
  module.exports = {
    viewPeriodDate,
    addDays,
    strAddDays,
    isDate,
    strDateFormat,
    getDateOfMonthByFlag,
  };