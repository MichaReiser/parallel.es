var webpack = require("webpack");
var Config = require("webpack-config").Config;

const FILE_NAME = "[name].parallel.js";

module.exports = new Config().extend("conf/web.base.config.js").merge({
  output: {
    filename: FILE_NAME
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: "awesome-typescript-loader",
            query: {
              useBabel: true,
              babelOptions: {
                presets: [["es2015", { modules: false }]],
                plugins: [
                  [
                    "transform-runtime",
                    {
                      regenerator: false
                    }
                  ]
                ]
              }
            }
          }
        ]
      }
    ]
  },

  plugins: [
    new webpack.LoaderOptionsPlugin({
      options: {
        worker: {
          inline: false,
          output: {
            filename: FILE_NAME
          }
        }
      }
    })
  ]
});
