var Config = require("webpack-config").Config;

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
    devtool: "#inline-source-map",
    output: {
        filename: FILE_NAME,
        pathinfo: true
    },
    worker: {
        output: {
            filename: FILE_NAME
        }
    },
    watch: true,
    devServer: {
        stats: {
            chunks: false
        }
    }
});
