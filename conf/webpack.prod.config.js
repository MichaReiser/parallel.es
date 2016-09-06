var webpack = require("webpack");
var Config = require("webpack-config").Config;
var CompressionPlugin = require("compression-webpack-plugin");

module.exports = new Config().extend("conf/webpack.base.config.js").merge({
    entry: {
        "browser-es5-commonjs": "./src/browser/index-commonjs"
    },
    debug: false,
    devtool: "#source-map",
    plugins: [
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.optimize.UglifyJsPlugin(),
        new CompressionPlugin({
            asset: "[path].gz[query]",
            algorithm: "gzip",
            test: /\.js$|\.css$|\.html$/
        })
    ]
});