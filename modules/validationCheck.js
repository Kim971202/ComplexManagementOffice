// 10 번 코드 (empty condition)
function getVariables(...args) {
  itemsArray = new Array();
  itemsArray.push(...args);
  for (i = 0; i < itemsArray.length; ++i) {
    if (!itemsArray[i]) {
      return false;
    } else {
      return true;
    }
  }
}

module.exports = {
  getVariables,
};
