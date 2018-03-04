var webpack = require("webpack");
var Config = require("webpack-config").Config;
var CompressionPlugin = require("compression-webpack-plugin");
var UglifyJsPlugin = require("uglifyjs-webpack-plugin");

module.exports = new Config().extend("conf/node.es5.config.js").merge({
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
          comments: /WORKER_SLAVE_STATIC_FUNCTIONS_PLACEHOLDER/,
          mangle: {
            reserved: ["slaveFunctionLookupTable"]
          }
        }
      })
    ]
  },
  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(),
    new CompressionPlugin({
      asset: "[path].gz[query]",
      algorithm: "gzip",
      test: /\.js$|\.css$|\.html$/
    })
  ]
});
