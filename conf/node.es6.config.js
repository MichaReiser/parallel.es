var webpack = require("webpack");
var Config = require("webpack-config").Config;
var CompressionPlugin = require("compression-webpack-plugin");

const FILE_NAME = "[name].parallel-es6.js";

module.exports = new Config().extend("conf/node.base.config.js").merge({
  output: {
    filename: FILE_NAME
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: "awesome-typescript-loader"
          }
        ]
      }
    ]
  }
});
