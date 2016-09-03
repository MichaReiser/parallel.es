var CopyWebpackPlugin = require("copy-webpack-plugin");


module.exports = {
    entry: {
        browserExample: "./example/browser-example.js"
    },
    output: {
        path: './dist',
        filename: 'browserExample.js'
    },
    debug: true,
    devtool: "#inline-source-map",
    module: {
        preLoaders: [
            {
                test: /\/dist\/.*\.js$/,
                loader: "source-map-loader"
            }
        ]
    },
    plugins: [
        new CopyWebpackPlugin([{
            from: "./dist/worker-slave.parallel-es.js*",
            flatten: true
        }])
    ]
};
