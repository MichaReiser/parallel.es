var webpack = require("webpack");
var Config = require("webpack-config").Config;
var CompressionPlugin = require("compression-webpack-plugin");
var BabiliPlugin = require("babili-webpack-plugin");
var babiliPreset = require("babel-preset-babili");
var mangleNamesPlugin = require("babel-plugin-minify-mangle-names");

var mangleNamesIndex = babiliPreset.plugins.indexOf(mangleNamesPlugin);
babiliPreset.plugins[mangleNamesIndex] = [mangleNamesPlugin, { "blacklist": { "slaveFunctionLookupTable": true } }];

const FILE_NAME = "[name].parallel-es6.js";

module.exports = new Config().extend({
    "conf/webpack.base.config.js": function (config) {
        const awesomeLoader = config.module.loaders.find(function (loader) {
            return loader.loader === "awesome-typescript-loader";
        });

        awesomeLoader.query.useBabel = false;
        return config;
    }
}).merge({
    output: {
        filename: FILE_NAME
    },
    worker: {
        output: {
            filename: FILE_NAME
        }
    },
    devtool: "#source-map",
    plugins: [
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.OccurrenceOrderPlugin(),
        new BabiliPlugin({
            babili: babiliPreset
        }),
        new CompressionPlugin({
            asset: "[path].gz[query]",
            algorithm: "gzip",
            test: /\.js$|\.css$|\.html$/
        })
    ]
});
