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
import { TokenResponse, Claims } from "../signin/token";
import DoneCallback = jest.DoneCallback;
import { SignInSuccess, Transposit } from "../Transposit";

const BACKEND_ORIGIN: string = "https://arbys-beef-xyz12.transposit.io";
function backendUri(path: string = ""): string {
  return `${BACKEND_ORIGIN}${path}`;
}
const FRONTEND_ORIGIN: string = "https://arbys-beef.com";
function frontendUri(path: string = ""): string {
  return `${FRONTEND_ORIGIN}${path}`;
}

jest.mock("../signin/pkce-helper", () => ({
  pushCodeVerifier: () => "challenge-from-code-verifier",
  popCodeVerifier: () => "code-verifier",
}));

const NOW_MINUS_3_DAYS: number = 1521996119000;
const NOW: number = 1522255319000;
const NOW_PLUS_3_DAYS: number = 1522514519000;

function createUnsignedJwt(claims: Claims): string {
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
    setHref(FRONTEND_ORIGIN, "/", "");
  });

  const claims: Claims = Object.freeze({
    iss: BACKEND_ORIGIN,
    sub: "jplace@transposit.com",
    exp: NOW_PLUS_3_DAYS / 1000,
    iat: NOW_MINUS_3_DAYS / 1000,
  });
  const accessToken: string = createUnsignedJwt(claims);

  it("signs in", async () => {
    expect.assertions(5);
    setHref(FRONTEND_ORIGIN, "/", "");
    {
      const transposit: Transposit = new Transposit(BACKEND_ORIGIN);
      await transposit.signIn(frontendUri("/handle-signin"));
      expect(window.location.href).toEqual(
        backendUri(
          "/login/authorize?scope=openid+app&response_type=code&client_id=sdk&redirect_uri=https%3A%2F%2Farbys-beef.com%2Fhandle-signin&prompt=login&code_challenge=challenge-from-code-verifier&code_challenge_method=S256",
        ),
      );
    }

    (window.fetch as jest.Mock).mockReturnValueOnce(
      new Response(
        JSON.stringify({
          access_token: accessToken,
          needs_keys: false,
          user: { name: "Farmer May", email: "may@transposit.com" },
        } as TokenResponse),
      ),
    );

    setHref(FRONTEND_ORIGIN, "/handle-signin", `?code=some-code-to-trade`);
    {
      const transposit: Transposit = new Transposit(BACKEND_ORIGIN);
      const signInSuccess: SignInSuccess = await transposit.handleSignIn();

      expect(signInSuccess).toEqual({ needsKeys: false });
      expect(window.fetch as jest.Mock).toHaveBeenCalledWith(
        "https://arbys-beef-xyz12.transposit.io/login/authorize/token",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body:
            "grant_type=authorization_code&code=some-code-to-trade&redirect_uri=https%3A%2F%2Farbys-beef.com%2Fhandle-signin&code_verifier=code-verifier",
        },
      );
      expect(transposit.isSignedIn()).toBe(true);
    }

    setHref(FRONTEND_ORIGIN, "/", "");
    {
      const transposit: Transposit = new Transposit(BACKEND_ORIGIN);
      expect(transposit.isSignedIn()).toBe(true);
    }
  });

  // describe("isLoggedIn", () => {
  //   it("knows when you're logged out", () => {
  //     const transposit: Transposit = new Transposit(BACKEND_ORIGIN);

  //     expect(transposit.isSignedIn()).toBe(false);
  //   });

  //   it("knows when your session expired", () => {
  //     setHref(
  //       ARBYS_ORIGIN,
  //       "/",
  //       `?clientJwt=${jplaceArbysJwt}&needsKeys=false`,
  //     );

  //     let transposit: Transposit = new Transposit();
  //     transposit.handleSignIn();

  //     // 3 days after expiration
  //     MockDate.set((jplaceArbysClaims.exp + 60 * 60 * 24 * 3) * 1000);
  //     transposit = new Transposit();

  //     expect(transposit.isSignedIn()).toBe(false);
  //   });
  // });

  // describe("handleLogin", () => {
  //   it("calls replaceState", () => {
  //     setHref(
  //       ARBYS_ORIGIN,
  //       "/",
  //       `?clientJwt=${jplaceArbysJwt}&needsKeys=false`,
  //     );

  //     const transposit: Transposit = new Transposit();
  //     transposit.handleSignIn();

  //     expect(JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)!)).toEqual(
  //       jplaceArbysClaims,
  //     );
  //     expect(window.history.replaceState).toHaveBeenCalledWith(
  //       {},
  //       window.document.title,
  //       "/",
  //     );
  //   });

  //   it("redirects when needs keys", () => {
  //     setHref(ARBYS_ORIGIN, "/", `?clientJwt=${jplaceArbysJwt}&needsKeys=true`);

  //     const transposit: Transposit = new Transposit();
  //     transposit.handleSignIn();

  //     expect(JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)!)).toEqual(
  //       jplaceArbysClaims,
  //     );
  //     expect(window.location.href).toEqual(
  //       "/settings?redirectUri=https%3A%2F%2Farbys-beef-xyz12.transposit.io%2F",
  //     );
  //   });

  //   it("calls callback", () => {
  //     setHref(ARBYS_ORIGIN, "/", `?clientJwt=${jplaceArbysJwt}&needsKeys=true`);

  //     const mockCallback = jest.fn();

  //     const transposit: Transposit = new Transposit();
  //     transposit.handleSignIn(mockCallback);

  //     expect(JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)!)).toEqual(
  //       jplaceArbysClaims,
  //     );
  //     expect(mockCallback).toHaveBeenCalledWith({ needsKeys: true });
  //     expect(window.history.replaceState).not.toHaveBeenCalled();
  //   });

  //   it("throws if callback is not a function", (done: DoneCallback) => {
  //     setHref(ARBYS_ORIGIN, "/", `?clientJwt=${jplaceArbysJwt}&needsKeys=true`);

  //     const transposit: Transposit = new Transposit();
  //     try {
  //       transposit.handleSignIn("string" as any);
  //       done.fail();
  //     } catch (err) {
  //       expect(err.message).toContain("Provided callback is not a function.");
  //       done();
  //     }
  //   });

  //   it("throws without jwt", (done: DoneCallback) => {
  //     setHref(ARBYS_ORIGIN, "/", "");

  //     const transposit: Transposit = new Transposit();
  //     try {
  //       transposit.handleSignIn();
  //       done.fail();
  //     } catch (err) {
  //       expect(err.message).toContain(
  //         "clientJwt query parameter could not be found",
  //       );
  //       done();
  //     }
  //   });

  //   it("throws without needsKeys", (done: DoneCallback) => {
  //     setHref(ARBYS_ORIGIN, "/", `?clientJwt=${jplaceArbysJwt}`);

  //     const transposit: Transposit = new Transposit();
  //     try {
  //       transposit.handleSignIn();
  //       done.fail();
  //     } catch (err) {
  //       expect(err.message).toContain(
  //         "needsKeys query parameter could not be found. This is unexpected.",
  //       );
  //       done();
  //     }
  //   });

  //   function testInvalidJwt(done: DoneCallback, invalidJwt: string) {
  //     setHref(ARBYS_ORIGIN, "/", `?clientJwt=${invalidJwt}&needsKeys=false`);

  //     const transposit: Transposit = new Transposit();
  //     try {
  //       transposit.handleSignIn();
  //       done.fail();
  //     } catch (err) {
  //       expect(err.message).toContain(
  //         "clientJwt query parameter does not appear to be a valid JWT string",
  //       );
  //       done();
  //     }
  //   }

  //   it("throws with invalid jwt (empty)", (done: DoneCallback) => {
  //     testInvalidJwt(done, "");
  //   });

  //   it("throws with invalid jwt (not-properly formatted jwt)", (done: DoneCallback) => {
  //     testInvalidJwt(done, "adsfasfdfd.fdsafadfsf");
  //   });

  //   it("throws with invalid jwt (not-base64 jwt)", (done: DoneCallback) => {
  //     testInvalidJwt(done, "dffgdf--6667.fdsaf#f.");
  //   });

  //   it("throws with invalid jwt (not-json jwt)", (done: DoneCallback) => {
  //     testInvalidJwt(
  //       done,
  //       `${btoa("{ not-=json: yeeeee")}.${btoa("{ not-=json: yeeeee")}.`,
  //     );
  //   });

  //   it("throws with invalid jwt (expired)", (done: DoneCallback) => {
  //     const expiredClaims = Object.assign({}, jplaceArbysClaims, {
  //       exp: NOW_MINUS_3_DAYS / 1000,
  //     });
  //     testInvalidJwt(done, createUnsignedJwt(expiredClaims));
  //   });
  // });

  // describe("logout", () => {
  //   let transposit: Transposit;

  //   beforeEach(() => {
  //     setHref(
  //       ARBYS_ORIGIN,
  //       "/",
  //       `?clientJwt=${jplaceArbysJwt}&needsKeys=false`,
  //     );
  //     transposit = new Transposit();
  //     transposit.handleSignIn();
  //   });

  //   it("handles successful logout", () => {
  //     transposit.signOut(arbysUri("/login"));

  //     expect(localStorage.getItem(LOCAL_STORAGE_KEY)).toBeNull();
  //     expect(transposit.isSignedIn()).toBe(false);
  //     expect(window.location.href).toEqual(
  //       "/logout?redirectUri=https%3A%2F%2Farbys-beef-xyz12.transposit.io%2Flogin",
  //     );
  //   });
  // });

  // describe("startLoginUri", () => {
  //   it("returns the correct default location", () => {
  //     const transposit: Transposit = new Transposit(ARBYS_ORIGIN);

  //     expect(transposit.startSignInUri("https://altoids.com")).toEqual(
  //       "https://arbys-beef-xyz12.transposit.io/login/accounts?redirectUri=https%3A%2F%2Faltoids.com",
  //     );
  //   });

  //   it("returns the correct google location", () => {
  //     const transposit: Transposit = new Transposit(ARBYS_ORIGIN);

  //     expect(
  //       transposit.startSignInUri("https://altoids.com", "google"),
  //     ).toEqual(
  //       "https://arbys-beef-xyz12.transposit.io/login/accounts?redirectUri=https%3A%2F%2Faltoids.com&provider=google",
  //     );
  //     expect(transposit.getGoogleLoginLocation("https://altoids.com")).toEqual(
  //       "https://arbys-beef-xyz12.transposit.io/login/accounts?redirectUri=https%3A%2F%2Faltoids.com&provider=google",
  //     );
  //   });

  //   it("returns the correct slack location", () => {
  //     const transposit: Transposit = new Transposit(ARBYS_ORIGIN);

  //     expect(transposit.startSignInUri("https://altoids.com", "slack")).toEqual(
  //       "https://arbys-beef-xyz12.transposit.io/login/accounts?redirectUri=https%3A%2F%2Faltoids.com&provider=slack",
  //     );
  //   });
  // });
});
