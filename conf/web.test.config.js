var path = require("path");
var Config = require("webpack-config").Config;

module.exports = new Config()
  .extend({
    "./conf/web.es5.config.js": function(config) {
      delete config.entry;
      return config;
    }
  })
  .merge({
    devtool: "#inline-source-map"
  });
