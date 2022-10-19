var Config = require("webpack-config").Config;

module.exports = new Config().extend("conf/node.es6.config.js").merge({
	devtool: "#source-map",
	output: {
		pathinfo: true,
	},
	watch: true,
	devServer: {
		stats: {
			chunks: false,
		},
	},
});
