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
import { Transposit, TRANSPOSIT_CONSUME_KEY_PREFIX } from "../Transposit";

import DoneCallback = jest.DoneCallback;

function createUnsignedJwt(claims: any): string {
  const header: string = btoa(JSON.stringify({ alg: "none" }));
  const body: string = btoa(JSON.stringify(claims));
  return `${header}.${body}.`;
}

describe("Transposit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    MockDate.reset();
  });

  const jplaceArbysBaseUri: string = "https://arbys-beef-xyz12.transposit.io";
  const jplaceArbysClaims: any = Object.freeze({
    iss: jplaceArbysBaseUri,
    sub: "jplace@transposit.com",
    exp: 1522255319,
    iat: 1521650519,
    publicToken: "thisisapublictoken",
    repository: "jplace/arbys_beef",
  });

  function makeArbysTransposit(): Transposit {
    return new Transposit(jplaceArbysBaseUri);
  }

  describe("getGoogleLoginLocation", () => {
    it("returns the correct location", () => {
      const transposit: Transposit = makeArbysTransposit();

      expect(transposit.getGoogleLoginLocation("https://altoids.com")).toEqual(
        "https://arbys-beef-xyz12.transposit.io/login/accounts?redirectUri=https%3A%2F%2Faltoids.com",
      );
      expect(transposit.startLoginUri("https://altoids.com")).toEqual(
        "https://arbys-beef-xyz12.transposit.io/login/accounts?redirectUri=https%3A%2F%2Faltoids.com",
      );
    });
  });

  describe("login", () => {
    it("redirects on login", () => {
      const clientJwt: string = createUnsignedJwt(jplaceArbysClaims);

      window.location.href = `https://arbys.com/?clientJwt=${clientJwt}&needsKeys=false`;

      const transposit: Transposit = makeArbysTransposit();
      transposit.handleLogin();

      expect(
        JSON.parse(
          localStorage.getItem(
            `${TRANSPOSIT_CONSUME_KEY_PREFIX}/https://arbys-beef-xyz12.transposit.io`,
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

      window.location.href = `https://arbys.com/?clientJwt=${clientJwt}&needsKeys=true`;

      const transposit: Transposit = makeArbysTransposit();
      transposit.handleLogin();

      expect(
        JSON.parse(
          localStorage.getItem(
            `${TRANSPOSIT_CONSUME_KEY_PREFIX}/https://arbys-beef-xyz12.transposit.io`,
          )!,
        ),
      ).toEqual(jplaceArbysClaims);
      expect(window.location.href).toEqual(
        "https://arbys-beef-xyz12.transposit.io/connect?redirectUri=http%3A%2F%2Flocalhost%2F",
      );
    });

    it("calls callback on login", () => {
      const mockCallback = jest.fn();
      const clientJwt: string = createUnsignedJwt(jplaceArbysClaims);

      window.location.href = `https://arbys.com/?clientJwt=${clientJwt}&needsKeys=true`;

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
      expect(window.location.href).toEqual(
        `https://arbys.com/?clientJwt=${clientJwt}&needsKeys=true`,
      );
    });

    it("throws if callback is not a function", (done: DoneCallback) => {
      const clientJwt: string = createUnsignedJwt(jplaceArbysClaims);

      window.location.href = `https://arbys.com/?clientJwt=${clientJwt}&needsKeys=true`;

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
      window.location.href = `https://arbys.com/`;

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

      window.location.href = `https://arbys.com/?clientJwt=${clientJwt}`;

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
      window.location.href = `https://arbys.com/?clientJwt=${invalidJwt}&needsKeys=false`;

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
  });

  describe("isLoggedIn", () => {
    it("knows when you're logged in", () => {
      // 3 days before expiration
      MockDate.set((jplaceArbysClaims.exp - 60 * 60 * 24 * 3) * 1000);

      const clientJwt: string = createUnsignedJwt(jplaceArbysClaims);
      window.location.href = `https://arbys.com/?clientJwt=${clientJwt}&needsKeys=false`;
      const transposit: Transposit = makeArbysTransposit();
      transposit.handleLogin();

      expect(transposit.isLoggedIn()).toBe(true);
    });

    it("knows when you're logged out", () => {
      window.location.href = `https://arbys.com/`;
      const transposit: Transposit = makeArbysTransposit();

      expect(transposit.isLoggedIn()).toBe(false);
    });

    it("knows when your session expired", () => {
      // 3 days after expiration
      MockDate.set((jplaceArbysClaims.exp + 60 * 60 * 24 * 3) * 1000);

      const clientJwt: string = createUnsignedJwt(jplaceArbysClaims);
      window.location.href = `https://arbys.com/?clientJwt=${clientJwt}&needsKeys=false`;
      const transposit: Transposit = makeArbysTransposit();
      transposit.handleLogin();

      expect(transposit.isLoggedIn()).toBe(false);
    });
  });

  describe("logout", () => {
    let transposit: Transposit;

    beforeEach(() => {
      const clientJwt: string = createUnsignedJwt(jplaceArbysClaims);

      window.location.href = `https://arbys.com/?clientJwt=${clientJwt}&needsKeys=false`;

      transposit = makeArbysTransposit();
      transposit.handleLogin();
    });

    it("handles successful logout", async () => {
      expect.assertions(1);

      (window.fetch as jest.Mock<{}>).mockImplementation(() =>
        Promise.resolve(),
      );

      await transposit.logOut();

      expect(
        localStorage.getItem(
          `${TRANSPOSIT_CONSUME_KEY_PREFIX}/https://arbys-beef-xyz12.transposit.io`,
        ),
      ).toBeNull();
    });
  });
});
