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
  ClientClaims,
  Transposit,
  TRANSPOSIT_CONSUME_KEY_PREFIX,
} from "../Transposit";

import DoneCallback = jest.DoneCallback;

function createUnsignedJwt(expiredClaims: any): string {
  const header: string = btoa(JSON.stringify({ alg: "none" }));
  const body: string = btoa(JSON.stringify(expiredClaims));
  return `${header}.${body}.`;
}

describe("Transposit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    MockDate.set(NOW);
  });

  const NOW_MINUS_3_DAYS: number = 1521996119000;
  const NOW: number = 1522255319000;
  const NOW_PLUS_3_DAYS: number = 1522514519000;

  const jplaceArbysClaims: ClientClaims = Object.freeze({
    iss: "https://api.transposit.com",
    sub: "jplace@transposit.com",
    exp: NOW_PLUS_3_DAYS / 1000,
    iat: NOW_MINUS_3_DAYS / 1000,
    publicToken: "thisisapublictoken",
    repository: "jplace/arbys_beef",
    email: "jplace@transposit.com",
    name: "Jordan 'The Beef' Place",
  });

  function makeArbysTransposit(): Transposit {
    return new Transposit("jplace", "arbys_beef");
  }

  describe("startLoginUri", () => {
    it("returns the correct location", () => {
      const transposit: Transposit = new Transposit("jplace", "arbys_beef");

      expect(transposit.startLoginUri("https://altoids.com")).toEqual(
        "https://api.transposit.com/app/jplace/arbys_beef/login/accounts?redirectUri=https%3A%2F%2Faltoids.com",
      );
      expect(transposit.getGoogleLoginLocation("https://altoids.com")).toEqual(
        "https://api.transposit.com/app/jplace/arbys_beef/login/accounts?redirectUri=https%3A%2F%2Faltoids.com",
      );
    });

    it("returns the correct location (non-default transposit location)", () => {
      const transposit: Transposit = new Transposit(
        "jplace",
        "arbys_beef",
        "https://monkey.transposit.com",
      );

      expect(transposit.startLoginUri("https://altoids.com")).toEqual(
        "https://monkey.transposit.com/app/jplace/arbys_beef/login/accounts?redirectUri=https%3A%2F%2Faltoids.com",
      );
      expect(transposit.getGoogleLoginLocation("https://altoids.com")).toEqual(
        "https://monkey.transposit.com/app/jplace/arbys_beef/login/accounts?redirectUri=https%3A%2F%2Faltoids.com",
      );
    });
  });

  describe("handleLogin", () => {
    it("calls replaceState", () => {
      const clientJwt: string = createUnsignedJwt(jplaceArbysClaims);

      window.location.search = `?clientJwt=${clientJwt}&needsKeys=false`;

      const transposit: Transposit = makeArbysTransposit();
      transposit.handleLogin();

      expect(
        JSON.parse(
          localStorage.getItem(
            `${TRANSPOSIT_CONSUME_KEY_PREFIX}/jplace/arbys_beef`,
          )!,
        ),
      ).toEqual(jplaceArbysClaims);
      expect(window.history.replaceState).toHaveBeenCalledWith(
        {},
        window.document.title,
        "/",
      );
    });

    it("redirects when needs keys", () => {
      const clientJwt: string = createUnsignedJwt(jplaceArbysClaims);

      window.location.search = `?clientJwt=${clientJwt}&needsKeys=true`;

      const transposit: Transposit = makeArbysTransposit();
      transposit.handleLogin();

      expect(
        JSON.parse(
          localStorage.getItem(
            `${TRANSPOSIT_CONSUME_KEY_PREFIX}/jplace/arbys_beef`,
          )!,
        ),
      ).toEqual(jplaceArbysClaims);
      expect(window.location.href).toEqual(
        "https://api.transposit.com/app/jplace/arbys_beef/connect?redirectUri=http%3A%2F%2Flocalhost%2F",
      );
    });

    it("calls callback", () => {
      const mockCallback = jest.fn();
      const clientJwt: string = createUnsignedJwt(jplaceArbysClaims);

      window.location.search = `?clientJwt=${clientJwt}&needsKeys=true`;

      const transposit: Transposit = makeArbysTransposit();
      transposit.handleLogin(mockCallback);

      expect(
        JSON.parse(
          localStorage.getItem(
            `${TRANSPOSIT_CONSUME_KEY_PREFIX}/jplace/arbys_beef`,
          )!,
        ),
      ).toEqual(jplaceArbysClaims);
      expect(mockCallback).toHaveBeenCalledWith({ needsKeys: true });
      expect(window.history.replaceState).not.toHaveBeenCalled();
    });

    it("throws if callback is not a function", (done: DoneCallback) => {
      const clientJwt: string = createUnsignedJwt(jplaceArbysClaims);

      window.location.search = `?clientJwt=${clientJwt}&needsKeys=true`;

      const transposit: Transposit = makeArbysTransposit();
      try {
        transposit.handleLogin("string" as any);
        done.fail();
      } catch (err) {
        expect(err.message).toContain("Provided callback is not a function.");
        done();
      }
    });

    it("throws without jwt", (done: DoneCallback) => {
      window.location.search = "";

      const transposit: Transposit = makeArbysTransposit();
      try {
        transposit.handleLogin();
        done.fail();
      } catch (err) {
        expect(err.message).toContain(
          "clientJwt query parameter could not be found",
        );
        done();
      }
    });

    it("throws without needsKeys", (done: DoneCallback) => {
      const clientJwt: string = createUnsignedJwt(jplaceArbysClaims);

      window.location.search = `?clientJwt=${clientJwt}`;

      const transposit: Transposit = makeArbysTransposit();
      try {
        transposit.handleLogin();
        done.fail();
      } catch (err) {
        expect(err.message).toContain(
          "needsKeys query parameter could not be found. This is unexpected.",
        );
        done();
      }
    });

    function testInvalidJwt(done: DoneCallback, invalidJwt: string) {
      window.location.search = `?clientJwt=${invalidJwt}&needsKeys=false`;

      const transposit: Transposit = makeArbysTransposit();
      try {
        transposit.handleLogin();
        done.fail();
      } catch (err) {
        expect(err.message).toContain(
          "clientJwt query parameter does not appear to be a valid JWT string",
        );
        done();
      }
    }

    it("throws with invalid jwt (empty)", (done: DoneCallback) => {
      testInvalidJwt(done, "");
    });

    it("throws with invalid jwt (not-properly formatted jwt)", (done: DoneCallback) => {
      testInvalidJwt(done, "adsfasfdfd.fdsafadfsf");
    });

    it("throws with invalid jwt (not-base64 jwt)", (done: DoneCallback) => {
      testInvalidJwt(done, "dffgdf--6667.fdsaf#f.");
    });

    it("throws with invalid jwt (not-json jwt)", (done: DoneCallback) => {
      testInvalidJwt(
        done,
        `${btoa("{ not-=json: yeeeee")}.${btoa("{ not-=json: yeeeee")}.`,
      );
    });

    it("throws with invalid jwt (expired)", (done: DoneCallback) => {
      const expiredClaims = Object.assign({}, jplaceArbysClaims, {
        exp: NOW_MINUS_3_DAYS / 1000,
      });
      testInvalidJwt(done, createUnsignedJwt(expiredClaims));
    });
  });

  describe("isLoggedIn", () => {
    it("knows when you're logged in", () => {
      // 3 days before expiration
      MockDate.set((jplaceArbysClaims.exp - 60 * 60 * 24 * 3) * 1000);

      const clientJwt: string = createUnsignedJwt(jplaceArbysClaims);
      window.location.search = `?clientJwt=${clientJwt}&needsKeys=false`;
      const transposit: Transposit = makeArbysTransposit();
      transposit.handleLogin();

      expect(transposit.isLoggedIn()).toBe(true);
    });

    it("knows when you're logged out", () => {
      window.location.search = "";
      const transposit: Transposit = makeArbysTransposit();

      expect(transposit.isLoggedIn()).toBe(false);
    });

    it("knows when your session expired", () => {
      const clientJwt: string = createUnsignedJwt(jplaceArbysClaims);

      window.location.search = `?clientJwt=${clientJwt}&needsKeys=false`;

      let transposit: Transposit = makeArbysTransposit();
      transposit.handleLogin();

      // 3 days after expiration
      MockDate.set((jplaceArbysClaims.exp + 60 * 60 * 24 * 3) * 1000);
      transposit = makeArbysTransposit();

      expect(transposit.isLoggedIn()).toBe(false);
    });
  });

  describe("logout", () => {
    let transposit: Transposit;

    beforeEach(() => {
      const clientJwt: string = createUnsignedJwt(jplaceArbysClaims);

      window.location.search = `?clientJwt=${clientJwt}&needsKeys=false`;

      transposit = makeArbysTransposit();
      transposit.handleLogin();
    });

    it("handles successful logout", async () => {
      expect.assertions(2);

      (window.fetch as jest.Mock<{}>).mockImplementation(() =>
        Promise.resolve(),
      );

      await transposit.logOut();

      expect(
        localStorage.getItem(
          `${TRANSPOSIT_CONSUME_KEY_PREFIX}/jplace/arbys_beef`,
        ),
      ).toBeNull();
      expect(transposit.isLoggedIn()).toBe(false);
    });
  });
});
