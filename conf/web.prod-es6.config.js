var webpack = require("webpack");
var Config = require("webpack-config").Config;
var UglifyJsPlugin = require("uglifyjs-webpack-plugin");
var CompressionPlugin = require("compression-webpack-plugin");

module.exports = new Config().extend("conf/web.es6.config.js").merge({
  devtool: "#source-map",
  mode: "production",
  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        sourceMap: true,
        uglifyOptions: {
          output: {
            comments: /WORKER_SLAVE_STATIC_FUNCTIONS_PLACEHOLDER/
          },
          mangle: {
            reserved: ["slaveFunctionLookupTable"]
          }
        }
      })
    ]
  },
  plugins: [
    new CompressionPlugin({
      asset: "[path].gz[query]",
      algorithm: "gzip",
      test: /\.js$|\.css$|\.html$/
    })
  ]
});
