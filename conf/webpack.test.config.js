var path = require("path");
var Config = require("webpack-config").Config;

module.exports = new Config()
    .extend({
        "./conf/webpack.base.config.js": function (config) {
            delete config.entry;
            return config;
        }
    })
    .merge({
        debug: true,
        devtool: "#inline-source-map"
    });