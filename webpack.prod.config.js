var webpack = require("webpack");
var config = require("./webpack.config");
var CompressionPlugin = require("compression-webpack-plugin");

config.debug = false;
config.devtool = "source-map";
config.plugins = config.plugins.concat([
    new webpack.optimize.UglifyJsPlugin(),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new CompressionPlugin({
        asset: "[path].gz[query]",
        algorithm: "gzip",
        test: /\.js$|\.css$|\.html$/
    })
]);

module.exports = config;