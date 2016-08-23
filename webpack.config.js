var path = require("path");

module.exports = {
    entry: {
        browser: "./src/browser/index.ts"
    },
    debug: true,
    devtool: "inline-source-map",
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
                include: [path.resolve(__dirname, "./src/browser/slave")],
                loader: 'ts-loader?instance=webworker&configFileName=./src/browser/slave/tsconfig.json'
            },
            {
                test: /\.ts$/,
                include: [path.resolve(__dirname, "./src/common"), path.resolve(__dirname, "./src/browser")],
                exclude: [path.resolve(__dirname, "./src/browser/slave")],
                loader: 'ts-loader?instance=browser&configFileName=./src/browser/tsconfig.json'
            },
            {
                test: /\.ts$/,
                include: [path.resolve(__dirname, "./test")],
                loader: 'ts-loader?instance=tests&configFileName=./test/tsconfig.json'
            }
        ]
    },
    plugins: []
};
