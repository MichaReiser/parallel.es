var path = require("path");
var Config = require("webpack-config").Config;

module.exports = new Config()
	.extend({
		"./conf/node.es5.config.js": function (config) {
			config.entry = undefined;
			return config;
		},
	})
	.merge({
		devtool: "#inline-source-map",
	});
