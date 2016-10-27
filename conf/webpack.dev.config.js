var Config = require("webpack-config").Config;

const FILE_NAME = "[name].parallel-es6.js";

module.exports = new Config().extend("conf/webpack.base.config.js").merge({
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
