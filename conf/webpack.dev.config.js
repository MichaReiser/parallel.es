var Config = require("webpack-config").Config;
var CommonsChunkPlugin = require("webpack").optimize.CommonsChunkPlugin;

module.exports = new Config().extend({
    "conf/webpack.base.config.js": function (config) {
        delete config.entry;
        delete config.output.library;
        delete config.output.libraryTarget;

        return config;
    }
}).merge({
    entry: {
        example: "./example/browser-example.js"
    },
    debug: true,
    devtool: "#inline-source-map",
    output: {
        pathinfo: true
    },
    watch: true
});