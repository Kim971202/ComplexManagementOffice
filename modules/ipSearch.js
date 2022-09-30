var os = require("os");

function getServerIp() {
  var ifaces = os.networkInterfaces();

  var result = "";

  for (var dev in ifaces) {
    var alias = 0;

    ifaces[dev].forEach(function (details) {
      if (details.family == "IPv4" && details.internal === false) {
        result = details.address;

        ++alias;
      }
    });
  }

  return result;
}

module.exports = {
  getServerIp,
};
