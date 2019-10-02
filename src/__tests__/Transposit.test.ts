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
import { EndRequestLog } from "../EndRequestLog";
import {
  Claims,
  loadAccessToken,
  persistAccessToken,
  TokenResponse,
} from "../signin/token";
import { User } from "../signin/user";
import {
  createUnsignedJwt,
  NOW,
  NOW_MINUS_3_DAYS,
  NOW_PLUS_3_DAYS,
  setHref,
} from "../test/test-utils";
import { SignInSuccess, Transposit } from "../Transposit";
jest.mock("../signin/pkce-helper");

const BACKEND_ORIGIN: string = "https://arbys-beef-xyz12.transposit.io";
function backendUri(path: string = ""): string {
  return `${BACKEND_ORIGIN}${path}`;
}
const FRONTEND_ORIGIN: string = "https://arbys-beef.com";
function frontendUri(path: string = ""): string {
  return `${FRONTEND_ORIGIN}${path}`;
}

function makeSignedIn(accessToken: string) {
  persistAccessToken(accessToken);
}

describe("Transposit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    MockDate.set(NOW);
    setHref(FRONTEND_ORIGIN, "/", "");
  });

  const user: User = {
    name: "Kernel Sanders",
    email: "sanders@kernel.com",
  };
  const claims: Claims = Object.freeze({
    iss: BACKEND_ORIGIN,
    sub: `google|${user.email}`,
    exp: NOW_PLUS_3_DAYS / 1000,
    iat: NOW_MINUS_3_DAYS / 1000,
  });
  const accessToken: string = createUnsignedJwt(claims);

  it("signs in", async () => {
    expect.assertions(5);

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
      Promise.resolve(
        new Response(
          JSON.stringify({
            access_token: accessToken,
            needs_keys: false,
            user: { name: "Farmer May", email: "may@transposit.com" },
          } as TokenResponse),
        ),
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

  it("knows when you're signed out", () => {
    const transposit: Transposit = new Transposit(BACKEND_ORIGIN);
    expect(transposit.isSignedIn()).toBe(false);
  });

  it("knows when your session expired", () => {
    makeSignedIn(accessToken);
    let transposit: Transposit;

    transposit = new Transposit(BACKEND_ORIGIN);
    expect(transposit.isSignedIn()).toBe(true);

    // 3. days. later...
    MockDate.set((claims.exp + 60 * 60 * 24 * 3) * 1000);

    transposit = new Transposit(BACKEND_ORIGIN);
    expect(transposit.isSignedIn()).toBe(false);
  });

  it("starts sign-in with a specific provider", async () => {
    expect.assertions(1);

    const transposit: Transposit = new Transposit(`${BACKEND_ORIGIN}/`);

    await transposit.signIn(frontendUri("/handle-signin"), "google");
    expect(window.location.href).toEqual(
      backendUri(
        "/login/authorize?scope=openid+app&response_type=code&client_id=sdk&redirect_uri=https%3A%2F%2Farbys-beef.com%2Fhandle-signin&prompt=login&code_challenge=challenge-from-code-verifier&code_challenge_method=S256&provider=google",
      ),
    );
  });

  it("can't complete sign-in without a code", async () => {
    expect.assertions(1);

    const transposit: Transposit = new Transposit(BACKEND_ORIGIN);

    try {
      await transposit.handleSignIn();
    } catch (e) {
      expect(e.message).toBe(
        "code query parameter could not be found. This method should only be called after redirection during sign-in.",
      );
    }
  });

  it("can't complete sign-in if token endpoint returns 4XX", async () => {
    expect.assertions(1);

    setHref(FRONTEND_ORIGIN, "/handle-signin", `?code=some-code-to-trade`);

    (window.fetch as jest.Mock).mockReturnValueOnce(
      Promise.resolve(
        new Response(null, { status: 400, statusText: "Bad Request" }),
      ),
    );

    const transposit: Transposit = new Transposit(BACKEND_ORIGIN);

    try {
      await transposit.handleSignIn();
    } catch (e) {
      expect(e.message).toBe("Bad Request");
    }
  });

  it("can't complete sign-in if token endpoint network errors", async () => {
    expect.assertions(1);

    setHref(FRONTEND_ORIGIN, "/handle-signin", `?code=some-code-to-trade`);

    (window.fetch as jest.Mock).mockReturnValueOnce(
      Promise.reject(new Error("Network error")),
    );

    const transposit: Transposit = new Transposit(BACKEND_ORIGIN);

    try {
      await transposit.handleSignIn();
    } catch (e) {
      expect(e.message).toBe("Network error");
    }
  });

  it("signs out", () => {
    makeSignedIn(accessToken);
    const transposit: Transposit = new Transposit(BACKEND_ORIGIN);

    expect(transposit.isSignedIn()).toBe(true);

    transposit.signOut(frontendUri("/login"));

    expect(transposit.isSignedIn()).toBe(false);
    expect(loadAccessToken()).toBeNull();
    expect(window.location.href).toBe(
      "https://arbys-beef-xyz12.transposit.io/logout?redirectUri=https%3A%2F%2Farbys-beef.com%2Flogin",
    );
  });

  it("links to the settings page", () => {
    const transposit: Transposit = new Transposit(BACKEND_ORIGIN);
    expect(transposit.settingsUri(frontendUri("/success"))).toBe(
      "https://arbys-beef-xyz12.transposit.io/settings?redirectUri=https%3A%2F%2Farbys-beef.com%2Fsuccess",
    );
    expect(transposit.settingsUri()).toBe(
      "https://arbys-beef-xyz12.transposit.io/settings?redirectUri=https%3A%2F%2Farbys-beef.com%2F",
    );
  });

  it("doesn't load a user if not signed in", async () => {
    expect.assertions(1);

    const transposit: Transposit = new Transposit(BACKEND_ORIGIN);

    try {
      await transposit.loadUser();
    } catch (e) {
      expect(e.message).toBe(
        "This method can only be called if the user is signed in",
      );
    }
  });

  it("loads a user", async () => {
    expect.assertions(2);

    makeSignedIn(accessToken);
    const transposit: Transposit = new Transposit(BACKEND_ORIGIN);

    (window.fetch as jest.Mock).mockReturnValueOnce(
      Promise.resolve(new Response(JSON.stringify(user))),
    );

    const loadedUser: User = await transposit.loadUser();

    expect(loadedUser).toEqual(user);
    expect(window.fetch as jest.Mock).toHaveBeenCalledWith(
      "https://arbys-beef-xyz12.transposit.io/api/v1/user",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Bearer eyJhbGciOiJub25lIn0=.eyJpc3MiOiJodHRwczovL2FyYnlzLWJlZWYteHl6MTIudHJhbnNwb3NpdC5pbyIsInN1YiI6Imdvb2dsZXxzYW5kZXJzQGtlcm5lbC5jb20iLCJleHAiOjE1MjI1MTQ1MTksImlhdCI6MTUyMTk5NjExOX0=.",
        },
      },
    );
  });

  it("runs operation without sign-in", async () => {
    expect.assertions(2);

    const transposit: Transposit = new Transposit(BACKEND_ORIGIN);

    (window.fetch as jest.Mock).mockReturnValueOnce(
      Promise.resolve(
        new Response(
          JSON.stringify({
            status: "SUCCESS",
            requestId: "12345",
            result: {
              results: ["hello", "world"],
            },
          } as EndRequestLog),
        ),
      ),
    );

    const results: EndRequestLog = await transposit.run("hello_world");

    expect(results.result.results).toEqual(["hello", "world"]);
    expect(window.fetch as jest.Mock).toHaveBeenCalledWith(
      "https://arbys-beef-xyz12.transposit.io/api/v1/execute/hello_world",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: '{"parameters":{}}',
      },
    );
  });

  it("runs an operation with sign-in", async () => {
    expect.assertions(2);

    makeSignedIn(accessToken);
    const transposit: Transposit = new Transposit(BACKEND_ORIGIN);

    (window.fetch as jest.Mock).mockReturnValueOnce(
      Promise.resolve(
        new Response(
          JSON.stringify({
            status: "SUCCESS",
            requestId: "12345",
            result: {
              results: ["hello", "world"],
            },
          } as EndRequestLog),
        ),
      ),
    );

    const results: EndRequestLog = await transposit.run("hello_world");

    expect(results.result.results).toEqual(["hello", "world"]);
    expect(window.fetch as jest.Mock).toHaveBeenCalledWith(
      "https://arbys-beef-xyz12.transposit.io/api/v1/execute/hello_world",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Bearer eyJhbGciOiJub25lIn0=.eyJpc3MiOiJodHRwczovL2FyYnlzLWJlZWYteHl6MTIudHJhbnNwb3NpdC5pbyIsInN1YiI6Imdvb2dsZXxzYW5kZXJzQGtlcm5lbC5jb20iLCJleHAiOjE1MjI1MTQ1MTksImlhdCI6MTUyMTk5NjExOX0=.",
        },
        body: '{"parameters":{}}',
      },
    );
  });

  it("run an operation and throws errors", async () => {
    expect.assertions(1);

    makeSignedIn(accessToken);
    const transposit: Transposit = new Transposit(BACKEND_ORIGIN);

    (window.fetch as jest.Mock).mockReturnValueOnce(
      Promise.reject(
        new Response(null, { status: 400, statusText: "Bad Request" }),
      ),
    );
    try {
      await transposit.run("hello_world");
    } catch (e) {
      expect(e.statusText).toEqual("Bad Request");
    }
  });
});
