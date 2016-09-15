var path = require("path");
var webpack = require("webpack");
var Config = require("webpack-config").Config;
var CompressionPlugin = require("compression-webpack-plugin");
var CommonsChunkPlugin = require("webpack").optimize.CommonsChunkPlugin;

module.exports = new Config().extend("conf/webpack.prod.config.js").merge({
    entry: {
        "browser-es5-commonjs": "./src/browser/index-commonjs",
        "example": "./example/browser-example.ts",
        "performance-measurement": "./example/performance-measurement.ts"
    },
    output: {
        path: path.resolve(__dirname, "../gh-pages-out/artifacts")
    },
    debug: false,
    devtool: "#source-map",
    plugins: [
        new CommonsChunkPlugin("browser")
    ]
});