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
        example: "./example/browser-example.ts",
        "performance-measurement": "./example/performance-measurement.ts"
    },
    debug: true,
    devtool: "#inline-source-map",
    output: {
        pathinfo: true
    },
    watch: true,
    devServer: {
        stats: {
            chunks: false
        }
    },
    plugins: [
        new CommonsChunkPlugin("browser")
    ]
});