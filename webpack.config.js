module.exports = {
    entry: "./src/index.ts",
    debug: true,
    devtool: "inline-source-map",
    output: {
        library: "parallel-es",
        libraryTarget: "umd",
        path: __dirname + "/dist",
        filename: "bundle.js"
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
            { test: /\.ts?$/, loader: 'ts-loader' }
        ]
    },
    plugins: []
};
