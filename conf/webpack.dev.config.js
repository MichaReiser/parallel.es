var Config = require("webpack-config").Config;

module.exports = new Config().extend("conf/webpack.es6.config.js").merge({
    devtool: "#source-map",
    output: {
        filename: "[name].parallel.js", // by default the es5 build is used of parallel... we replace it for now with es6
        pathinfo: true
    },
    watch: true,
    devServer: {
        stats: {
            chunks: false
        }
    }
});
