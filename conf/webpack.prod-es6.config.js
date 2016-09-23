var webpack = require("webpack");
var Config = require("webpack-config").Config;
var CompressionPlugin = require("compression-webpack-plugin");

const FILE_NAME = "[name].parallel-es6.js";

module.exports = new Config().extend("conf/webpack.base.config.js", function (config) {
    const awesomeLoader = config.loaders.find(function (loader) {
        return loader.loader === "awesome-typescript-loader";
    });

    awesomeLoader.query.useBabel = false;
    return config;
}).merge({
    output: {
        filename: FILE_NAME
    },
    worker: {
        output: {
            filename: FILE_NAME
        }
    },
    debug: true,
    devtool: "#source-map",
    plugins: [
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.OccurrenceOrderPlugin(),
        // does not yet support es 6 new webpack.optimize.UglifyJsPlugin(),
        new CompressionPlugin({
            asset: "[path].gz[query]",
            algorithm: "gzip",
            test: /\.js$|\.css$|\.html$/
        })
    ]
});