var webpack = require("webpack");
var Config = require("webpack-config").Config;
var CompressionPlugin = require("compression-webpack-plugin");

module.exports = new Config().extend("conf/webpack.base.config.js").merge({
    entry: {
        "browser-commonjs": "./src/browser/index-commonjs"
    },
    devtool: "#source-map",
    plugins: [
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.optimize.UglifyJsPlugin({
            sourceMap: true,
            comments: /WORKER_SLAVE_STATIC_FUNCTIONS_PLACEHOLDER/,
            mangle: {
                except: ["slaveFunctionLookupTable"]
            }
        }),
        new CompressionPlugin({
            asset: "[path].gz[query]",
            algorithm: "gzip",
            test: /\.js$|\.css$|\.html$/
        })
    ]
});
