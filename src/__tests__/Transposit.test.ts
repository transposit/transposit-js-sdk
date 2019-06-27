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
import { ClientClaims, LOCAL_STORAGE_KEY, Transposit } from "../Transposit";
import DoneCallback = jest.DoneCallback;

const ARBYS_ORIGIN: string = "https://arbys-beef-xyz12.transposit.io";

function arbysUri(path: string = ""): string {
  return `${ARBYS_ORIGIN}${path}`;
}

const NOW_MINUS_3_DAYS: number = 1521996119000;
const NOW: number = 1522255319000;
const NOW_PLUS_3_DAYS: number = 1522514519000;

function createUnsignedJwt(claims: ClientClaims): string {
  const header: string = btoa(JSON.stringify({ alg: "none" }));
  const body: string = btoa(JSON.stringify(claims));
  return `${header}.${body}.`;
}

function setHref(origin: string, pathname: string, search: string): void {
  window.location.href = `${origin}${pathname}${search}`;
  (window.location as any).origin = origin; // origin is normally read-only, but not in tests :)
  window.location.pathname = pathname;
  window.location.search = search;
}

describe("Transposit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    MockDate.set(NOW);
    setHref(ARBYS_ORIGIN, "/", "");
  });

  const jplaceArbysClaims: ClientClaims = Object.freeze({
    iss: ARBYS_ORIGIN,
    sub: "jplace@transposit.com",
    exp: NOW_PLUS_3_DAYS / 1000,
    iat: NOW_MINUS_3_DAYS / 1000,
    publicToken: "thisisapublictoken",
    repository: "jplace/arbys_beef",
    email: "jplace@transposit.com",
    name: "Jordan 'The Beef' Place",
  });
  const jplaceArbysJwt: string = createUnsignedJwt(jplaceArbysClaims);

  describe("isLoggedIn", () => {
    it("knows when you've just logged in", () => {
      setHref(
        ARBYS_ORIGIN,
        "/",
        `?clientJwt=${jplaceArbysJwt}&needsKeys=false`,
      );

      const transposit: Transposit = new Transposit();
      transposit.handleLogin();

      expect(transposit.isLoggedIn()).toBe(true);
    });

    it("knows when you're logged out", () => {
      const transposit: Transposit = new Transposit();

      expect(transposit.isLoggedIn()).toBe(false);
    });

    it("knows when your session expired", () => {
      setHref(
        ARBYS_ORIGIN,
        "/",
        `?clientJwt=${jplaceArbysJwt}&needsKeys=false`,
      );

      let transposit: Transposit = new Transposit();
      transposit.handleLogin();

      // 3 days after expiration
      MockDate.set((jplaceArbysClaims.exp + 60 * 60 * 24 * 3) * 1000);
      transposit = new Transposit();

      expect(transposit.isLoggedIn()).toBe(false);
    });
  });

  describe("handleLogin", () => {
    it("calls replaceState", () => {
      setHref(
        ARBYS_ORIGIN,
        "/",
        `?clientJwt=${jplaceArbysJwt}&needsKeys=false`,
      );

      const transposit: Transposit = new Transposit();
      transposit.handleLogin();

      expect(JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)!)).toEqual(
        jplaceArbysClaims,
      );
      expect(window.history.replaceState).toHaveBeenCalledWith(
        {},
        window.document.title,
        "/",
      );
    });

    it("redirects when needs keys", () => {
      setHref(ARBYS_ORIGIN, "/", `?clientJwt=${jplaceArbysJwt}&needsKeys=true`);

      const transposit: Transposit = new Transposit();
      transposit.handleLogin();

      expect(JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)!)).toEqual(
        jplaceArbysClaims,
      );
      expect(window.location.href).toEqual(
        "/settings?redirectUri=https%3A%2F%2Farbys-beef-xyz12.transposit.io%2F",
      );
    });

    it("calls callback", () => {
      setHref(ARBYS_ORIGIN, "/", `?clientJwt=${jplaceArbysJwt}&needsKeys=true`);

      const mockCallback = jest.fn();

      const transposit: Transposit = new Transposit();
      transposit.handleLogin(mockCallback);

      expect(JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)!)).toEqual(
        jplaceArbysClaims,
      );
      expect(mockCallback).toHaveBeenCalledWith({ needsKeys: true });
      expect(window.history.replaceState).not.toHaveBeenCalled();
    });

    it("throws if callback is not a function", (done: DoneCallback) => {
      setHref(ARBYS_ORIGIN, "/", `?clientJwt=${jplaceArbysJwt}&needsKeys=true`);

      const transposit: Transposit = new Transposit();
      try {
        transposit.handleLogin("string" as any);
        done.fail();
      } catch (err) {
        expect(err.message).toContain("Provided callback is not a function.");
        done();
      }
    });

    it("throws without jwt", (done: DoneCallback) => {
      setHref(ARBYS_ORIGIN, "/", "");

      const transposit: Transposit = new Transposit();
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
      setHref(ARBYS_ORIGIN, "/", `?clientJwt=${jplaceArbysJwt}`);

      const transposit: Transposit = new Transposit();
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
      setHref(ARBYS_ORIGIN, "/", `?clientJwt=${invalidJwt}&needsKeys=false`);

      const transposit: Transposit = new Transposit();
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

  describe("logout", () => {
    let transposit: Transposit;

    beforeEach(() => {
      setHref(
        ARBYS_ORIGIN,
        "/",
        `?clientJwt=${jplaceArbysJwt}&needsKeys=false`,
      );
      transposit = new Transposit();
      transposit.handleLogin();
    });

    it("handles successful logout", () => {
      transposit.logOut(arbysUri("/login"));

      expect(localStorage.getItem(LOCAL_STORAGE_KEY)).toBeNull();
      expect(transposit.isLoggedIn()).toBe(false);
      expect(window.location.href).toEqual(
        "/logout?redirectUri=https%3A%2F%2Farbys-beef-xyz12.transposit.io%2Flogin",
      );
    });
  });

  describe("startLoginUri", () => {
    it("returns the correct location", () => {
      const transposit: Transposit = new Transposit(ARBYS_ORIGIN);

      expect(transposit.startLoginUri("https://altoids.com")).toEqual(
        "https://arbys-beef-xyz12.transposit.io/login/accounts?redirectUri=https%3A%2F%2Faltoids.com&provider=google",
      );
      expect(transposit.getGoogleLoginLocation("https://altoids.com")).toEqual(
        "https://arbys-beef-xyz12.transposit.io/login/accounts?redirectUri=https%3A%2F%2Faltoids.com&provider=google",
      );
    });

    it("returns the correct location", () => {
      const transposit: Transposit = new Transposit(ARBYS_ORIGIN);

      expect(transposit.startLoginUri("https://altoids.com", "slack")).toEqual(
        "https://arbys-beef-xyz12.transposit.io/login/accounts?redirectUri=https%3A%2F%2Faltoids.com&provider=slack",
      );
    });
  });
});
