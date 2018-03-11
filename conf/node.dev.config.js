var Config = require("webpack-config").Config;

module.exports = new Config().extend("conf/node.base.config.js").merge({
  devtool: "#source-map",
  output: {
    pathinfo: true
  },
  mode: "development",
  watch: true,
  devServer: {
    stats: {
      chunks: false
    }
  }
});
