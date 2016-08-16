var webpack = require("webpack");
var config = require("./webpack.config");

config.debug = false;
config.devtool = "source-map";
config.plugins = config.plugins.concat([
    new webpack.optimize.UglifyJsPlugin(),
    new webpack.optimize.OccurrenceOrderPlugin()
]);

module.exports = config;