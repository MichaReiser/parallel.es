var Config = require("webpack-config").Config;

module.exports = new Config().extend("conf/webpack.base.config.js").merge({
    devtool: "#inline-source-map",
    output: {
        pathinfo: true
    },
    watch: true,
    devServer: {
        stats: {
            chunks: false
        }
    }
});
