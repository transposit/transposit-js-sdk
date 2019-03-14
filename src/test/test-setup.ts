/*
 * Copyright 2018 Transposit Corporation. All Rights Reserved.
 */

import "jest-localstorage-mock";

// Most hilarious work around courtesy of https://github.com/facebook/jest/issues/5124
const windowLocation = JSON.stringify(window.location);
delete window.location;
Object.defineProperty(window, "location", {
  value: JSON.parse(windowLocation),
});
Object.defineProperty(window, "open", {
  value: jest.fn(),
});
Object.defineProperty(window, "fetch", {
  value: jest.fn(),
});
Object.defineProperty(window.history, "replaceState", {
  value: jest.fn(),
});
