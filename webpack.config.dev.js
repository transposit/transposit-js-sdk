/*
 * Copyright 2018 Transposit Corporation. All Rights Reserved.
 */

const path = require("path");

module.exports = {
  entry: {
    bundle: "./src/index.ts",
  },
  output: {
    filename: "[name].dev.js",
    sourceMapFilename: "[name].dev.map",
    path: path.join(__dirname, "dist"),
    library: "Transposit",
    libraryTarget: "umd",
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        include: path.join(__dirname, "src"),
        use: ["ts-loader"],
      },
    ],
  },
  resolve: {
    extensions: [".ts"],
  },
  mode: "development",
  devtool: "cheap-module-source-map",
};
