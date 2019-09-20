/*
 * Copyright 2019 Transposit Corporation. All Rights Reserved.
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

import { setHref } from "../test/test-utils";
import { chompSlash, formUrlEncode, hereWithoutSearch } from "../utils";

describe("util", () => {
  it("chomps slash", () => {
    expect(chompSlash("https://gwen.com/")).toBe("https://gwen.com");
    expect(chompSlash("https://gwen.com")).toBe("https://gwen.com");
  });

  it("finds here without search", () => {
    setHref("https://gwen.com", "/hello", "?c=some-campaign");
    expect(hereWithoutSearch()).toBe("https://gwen.com/hello");
  });

  it("form encodes urls", () => {
    expect(
      formUrlEncode({
        hello: "world",
        redirect_uri: "https://gwen.com/?c=some-campaign",
      }),
    ).toBe(
      "hello=world&redirect_uri=https%3A%2F%2Fgwen.com%2F%3Fc%3Dsome-campaign",
    );
  });
});
