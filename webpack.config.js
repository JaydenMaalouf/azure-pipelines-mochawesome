const path = require("path");
const fs = require("fs");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: {
    tabContent: "./src/AllureReportTab/tabContent.tsx"
  },
  output: {
    filename: "AllureReportTab/[name].js"
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
    alias: {
      "azure-devops-extension-sdk": path.resolve(
        "node_modules/azure-devops-extension-sdk"
      ),
    }
  },
  stats: {
    warnings: false
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
      }      
    ]
  },
  plugins: [
    new CopyWebpackPlugin([ { from: "**/*.html", context: "src/" }])
  ]
};
