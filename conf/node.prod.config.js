var webpack = require("webpack");
var Config = require("webpack-config").Config;
var CompressionPlugin = require("compression-webpack-plugin");
var UglifyJsPlugin = require("uglifyjs-webpack-plugin");

module.exports = new Config().extend("conf/node.base.config.js").merge({
  entry: {
    "node-commonjs": "./src/api/node-commonjs"
  },
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
