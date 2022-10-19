var Config = require("webpack-config").Config;
var path = require("path");
var webpack = require("webpack");

module.exports = new Config().merge({
	entry: {
		node: "./src/api/node.ts",
		"node-slave": "./src/node/worker-slave/index.ts",
	},

	module: {
		noParse: [/src\/node\/worker\/node-worker-slave-file-name.ts/],
	},

	target: "node",

	output: {
		library: "parallel-es",
		libraryTarget: "umd",
		path: path.resolve(__dirname, "../dist"),
	},

	node: {
		__dirname: false,
	},

	resolve: {
		extensions: [".webpack.js", ".web.js", ".ts", ".js"],
	},

	plugins: [
		new webpack.DefinePlugin({
			SLAVE_FILE_NAME:
				'require.resolve("parallel-es/dist/node-slave.parallel.js")',
		}),
	],
});
