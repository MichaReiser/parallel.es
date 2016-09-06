var process = require("process");
var webpackConfig = require("webpack-config");
var Config = webpackConfig.Config;
var environment = webpackConfig.environment;

environment.setAll({
    env: function () { return process.env.NODE_ENV; }
});

module.exports = new Config().extend("conf/webpack.[env].config.js");