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

import * as MockDate from "mockdate";
import {
  createUnsignedJwt,
  NOW,
  NOW_MINUS_3_DAYS,
  NOW_PLUS_3_DAYS,
} from "../../test/test-utils";
import {
  Claims,
  clearPersistedData,
  loadAccessToken,
  persistAccessToken,
} from "../token";

const ACCESS_TOKEN_KEY = "TRANSPOSIT_ACCESS_TOKEN";

describe("token", () => {
  beforeEach(() => {
    localStorage.clear();
    MockDate.set(NOW);
  });

  const claims: Claims = Object.freeze({
    iss: "https://gwen.com",
    sub: "jplace@transposit.com",
    exp: NOW_PLUS_3_DAYS / 1000,
    iat: NOW_MINUS_3_DAYS / 1000,
  });
  const accessToken: string = createUnsignedJwt(claims);

  it("persists an access_token", () => {
    persistAccessToken(accessToken);
    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBe(accessToken);
  });

  it("load a valid access_token", () => {
    persistAccessToken(accessToken);

    const loadedToken = loadAccessToken();
    expect(loadedToken).toBe(accessToken);
  });

  it("doesn't load an expired access_token", () => {
    persistAccessToken(accessToken);

    // 3. days. later...
    MockDate.set((claims.exp + 60 * 60 * 24 * 3) * 1000);

    const loadedToken = loadAccessToken();
    expect(loadedToken).toBeNull();
  });

  it("doesn't load a junk access_token", () => {
    persistAccessToken("total-junk");

    const loadedToken = loadAccessToken();
    expect(loadedToken).toBeNull();
  });

  it("doesn't load a non-existent access_token", () => {
    const loadedToken = loadAccessToken();
    expect(loadedToken).toBeNull();
  });

  it("clears an access_token", () => {
    persistAccessToken("total-junk");

    clearPersistedData();

    const loadedToken = loadAccessToken();
    expect(loadedToken).toBeNull();
  });
});
