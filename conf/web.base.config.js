var Config = require("webpack-config").Config;
var path = require("path");

module.exports = new Config().merge({
	entry: {
		browser: "./src/api/browser.ts",
	},

	output: {
		library: "parallel-es",
		libraryTarget: "umd",
		path: path.resolve(__dirname, "../dist"),
	},

	resolve: {
		extensions: [".webpack.js", ".web.js", ".ts", ".js"],
	},
});
