/*
 * Copyright 2018, 2019 Transposit Corporation. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
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
