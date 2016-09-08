var Config = require("webpack-config").Config;
var path = require("path");

module.exports = new Config().merge({
    entry: {
        browser: "./src/browser/index.ts"
    },
    output: {
        library: "parallel-es",
        libraryTarget: "umd",
        path: path.resolve(__dirname, "../dist"),
        filename: "[name].parallel-es.js"
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
                loader: "babel-loader!ts-loader"
            }
        ]
    }
});