const path = require("path");
const fs = require("fs");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
    entry: "./src/index.js",
    output: {
        filename: "[name]/[name].js"
    },
    resolve: {
        extensions: [".js"],
    },
    stats: {
        warnings: false
    },
    module: {
        rules: [
            
        ]
    },
    plugins: [
        new CopyWebpackPlugin([ { from: "**/*.html", context: "src/" }])
    ]
};
