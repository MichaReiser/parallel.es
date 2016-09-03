var path = require("path");

module.exports = {
    entry: {
        browser: "./src/browser/index.ts"
    },
    debug: true,
    devtool: "#inline-source-map",
    output: {
        library: "parallel-es",
        libraryTarget: "umd",
        path: __dirname + "/dist",
        filename: "[name].parallel-es.js"
    },
    resolve: {
        extensions: ['', '.webpack.js', '.web.js', '.ts', '.js']
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
                loader: 'awesome-typescript-loader?useBabel=true'
            }
        ]
    },
    plugins: []
};
