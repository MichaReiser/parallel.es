var process = require("process");
var webpackConfig = require("webpack-config");
var Config = webpackConfig.Config;
var environment = webpackConfig.environment;

environment.setAll({
	env: function () {
		return process.env.NODE_ENV;
	},
});

if (process.env.NODE_ENV !== "test" && process.env.NODE_ENV !== "test-ci") {
	module.exports = [
		new Config().extend("conf/web.[env].config"),
		new Config().extend("conf/web.[env]-es6.config"),
		new Config().extend("conf/node.[env].config"),
		new Config().extend("conf/node.[env]-es6.config"),
	];
} else {
	module.exports = [
		new Config().extend("conf/web.[env].config.js"),
		//new Config().extend("conf/node.[env].config.js")
	];
}
