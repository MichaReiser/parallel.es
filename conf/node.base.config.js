var Config = require("webpack-config").Config;
var path = require("path");

module.exports = new Config().merge({
    entry: {
        node: "./src/api/node.ts",
        "node-slave": "./src/node/worker-slave/index.ts"
    },

    module: {
        rules: [
            {
                test: /\.ts$/,
                enforce: "pre",
                loader: "tslint-loader"
            }
        ]
    },

    target: "node",

    output: {
        library: "parallel-es",
        libraryTarget: "umd",
        path: path.resolve(__dirname, "../dist")
    },

    resolve: {
        extensions: [".webpack.js", ".web.js", ".ts", ".js"]
    }
});
