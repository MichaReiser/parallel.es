var path = require("path");
var Config = require("webpack-config").Config;

module.exports = new Config()
    .extend("./conf/webpack.test.config.js")
    .merge({
        module: {
            postLoaders: [
                {
                    test: /\.ts$/,
                    loader: "istanbul-instrumenter?esModules=true",
                    include: path.resolve("./src"),
                    exclude: path.resolve("./src/browser/worker-slave/index")
                }
            ]
        }
    });