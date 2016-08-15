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
        // Add `.ts` and `.tsx` as a resolvable extension.
        extensions: ['', '.webpack.js', '.web.js', '.ts', '.js']
    },
    module: {
        loaders: [
            { test: /\.ts?$/, loader: 'ts-loader' }
        ]
    },
    plugins: []
};
