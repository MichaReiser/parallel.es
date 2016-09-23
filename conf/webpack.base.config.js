var Config = require("webpack-config").Config;
var path = require("path");

const FILE_NAME = "[name].parallel.js";

module.exports = new Config().merge({
    entry: {
        browser: "./src/browser/index.ts"
    },
    output: {
        library: "parallel-es",
        libraryTarget: "umd",
        path: path.resolve(__dirname, "../dist"),
        filename: FILE_NAME
    },
    worker: {
        inline: false,
        output: {
            filename: FILE_NAME
        }
    },
    resolve: {
        extensions: ["", ".webpack.js", ".web.js", ".ts", ".js"]
    },
    module: {
        preLoaders: [
            {
                test: /\.ts$/,
                loader: "tslint"
            }
        ],
        loaders: [
            {
                test: /\.ts$/,
                loader: "awesome-typescript-loader",
                query: {
                    useBabel: true
                }
            }
        ]
    }
});