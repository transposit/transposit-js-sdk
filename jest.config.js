/*
 * Copyright 2018 Transposit Corporation. All Rights Reserved.
 */

module.exports = {
  reporters: ["default", "jest-junit"],
  roots: ["<rootDir>/src/"],
  testRegex: "(/__tests__/.*|\\.(test|spec))\\.ts$",
  testMatch: null,
  moduleFileExtensions: ["ts", "js", "json"],
  preset: "ts-jest/presets/default",
  setupTestFrameworkScriptFile: "<rootDir>/src/test/test-setup.ts",
  verbose: false,
  globals: {
    "ts-jest": {
      diagnostics: false,
    },
  },
};