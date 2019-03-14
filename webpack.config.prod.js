/*
 * Copyright 2018 Transposit Corporation. All Rights Reserved.
 */

const path = require("path");

module.exports = {
  // Don't attempt to continue if there are any errors.
  bail: true,
  entry: {
    bundle: "./src/index.ts",
  },
  output: {
    filename: "[name].prod.js",
    sourceMapFilename: "[name].prod.map",
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
  devtool: "source-map",
  mode: "production",
};
