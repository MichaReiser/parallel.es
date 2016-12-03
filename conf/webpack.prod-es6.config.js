var webpack = require("webpack");
var Config = require("webpack-config").Config;
var CompressionPlugin = require("compression-webpack-plugin");

module.exports = new Config().extend("conf/webpack.es6.config.js").merge({
    devtool: "#source-map",
    plugins: [
        new webpack.optimize.OccurrenceOrderPlugin(),
        new CompressionPlugin({
            asset: "[path].gz[query]",
            algorithm: "gzip",
            test: /\.js$|\.css$|\.html$/
        })
    ]
});
