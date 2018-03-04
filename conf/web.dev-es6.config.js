var Config = require("webpack-config").Config;

module.exports = new Config().extend("conf/web.es6.config.js").merge({
  devtool: "#source-map",
  output: {
    pathinfo: true
  },
  watch: true,
  mode: "development",
  devServer: {
    stats: {
      chunks: false
    }
  }
});
