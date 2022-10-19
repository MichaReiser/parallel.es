var Config = require("webpack-config").Config;
var path = require("path");

module.exports = new Config().merge({
	entry: {
		browser: "./src/api/browser.ts",
	},

	module: {
		rules: [
			{
				test: /\.ts$/,
				enforce: "pre",
				loader: "tslint-loader",
			},
		],
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
