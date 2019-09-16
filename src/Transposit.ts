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

import { EndRequestLog } from ".";
import { popCodeVerifier, pushCodeVerifier } from "./pkce-helper";
import {
  clearPersistedData,
  loadAccessToken,
  loadUser,
  persistAccessToken,
  persistUser,
  TokenResponse,
  User,
} from "./token";

export interface OperationParameters {
  [paramName: string]: string;
}

function chompSlash(string: string) {
  return string.replace(/\/$/, "");
}

// https://my-app.transposit.io?clientJwt=...needKeys=... -> https://my-app.transposit.io
function hereWithoutSearch(): string {
  return `${window.location.origin}${window.location.pathname}`;
}

function formUrlEncode(data: { [key: string]: string }): string {
  return Object.keys(data)
    .map(key => {
      return encodeURIComponent(key) + "=" + encodeURIComponent(data[key]);
    })
    .join("&");
}

export const SESSION_KEY = "TRANSPOSIT_SESSION";
export const USER_KEY = "TRANSPOSIT_USER";

export class Transposit {
  private hostedAppOrigin: string;
  private accessToken: string | null;
  private user: User | null;

  constructor(hostedAppOrigin: string = "") {
    this.hostedAppOrigin = chompSlash(hostedAppOrigin);
    this.accessToken = null;
    this.user = null;

    this.load();
  }

  private uri(path: string = ""): string {
    return `${this.hostedAppOrigin}${path}`;
  }

  private load(): void {
    this.accessToken = loadAccessToken();
    // todo this seems pretty unsafe from a security perspective
    this.user = loadUser();
  }

  private assertSignedIn(): void {
    if (this.accessToken === null || this.user === null) {
      throw new Error("Missing accessToken or user. No one is signed in.");
    }
  }

  isSignedIn(): boolean {
    return this.accessToken !== null && this.user !== null;
  }

  async signIn(
    redirectUri: string,
    provider?: "google" | "slack",
  ): Promise<void> {
    // todo do we want this state?
    // Create and store a random "state" value
    // var state = generateRandomString();
    // localStorage.setItem("pkce_state", state);

    const codeChallenge = await pushCodeVerifier();

    // Redirect to the authorization server
    const params = new URLSearchParams();
    params.append("scope", "openid"); // todo is this scope right?
    params.append("response_type", "code");
    params.append("client_id", "sdk"); // todo fix this server-side
    params.append("redirect_uri", redirectUri);
    params.append("prompt", "login");
    params.append("code_challenge", codeChallenge);
    params.append("code_challenge_method", "S256");
    if (provider) {
      params.append("provider", provider);
    }
    window.location.href = this.uri(`/login/authorize?${params.toString()}`);
  }

  // todo how should this callback work?
  async handleSignIn(
    callback?: (info: { needsKeys: boolean }) => void,
  ): Promise<void> {
    if (callback && typeof callback !== "function") {
      throw new Error("Provided callback is not a function.");
    }

    // Read query parameters

    // todo the Okta example is still using an anti-forgery token. Do I need that here too?

    const searchParams = new URLSearchParams(window.location.search);

    if (!searchParams.has("code")) {
      throw new Error(
        "code query parameter could not be found. This method should only be called after redirection during sign-in.",
      );
    }
    const code = searchParams.get("code")!;

    // Exchange code for access_token

    const codeVerifier = popCodeVerifier();

    // todo better handling for promise rejection here?
    const response = await fetch(this.uri(`/login/authorize/token`), {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formUrlEncode({
        grant_type: "authorization_code",
        code,
        redirect_uri: hereWithoutSearch(),
        code_verifier: codeVerifier,
      }),
    });

    // todo some better error handling than this
    if (response.status !== 200) {
      throw new Error("Exchange was unsuccessful");
    }

    const tokenResponse = (await response.json()) as TokenResponse;

    // Perform sign-in

    persistAccessToken(tokenResponse.access_token);
    persistUser(tokenResponse.user);
    this.accessToken = tokenResponse.access_token;
    this.user = tokenResponse.user;

    if (callback) {
      callback({ needsKeys: tokenResponse.needs_keys });
    } else {
      if (tokenResponse.needs_keys) {
        window.location.href = this.settingsUri(hereWithoutSearch());
      } else {
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );
      }
    }
  }

  signOut(redirectUri: string): void {
    this.accessToken = null;
    this.user = null;
    clearPersistedData();

    window.location.href = this.uri(
      `/logout?redirectUri=${encodeURIComponent(redirectUri)}`,
    );
  }

  settingsUri(redirectUri?: string): string {
    return this.uri(
      `/settings?redirectUri=${encodeURIComponent(
        redirectUri || window.location.href,
      )}`,
    );
  }

  getUser(): User {
    this.assertSignedIn();
    return this.user!;
  }

  async run(
    operationId: string,
    parameters: OperationParameters = {},
  ): Promise<EndRequestLog> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(this.uri(`/api/v1/execute/${operationId}`), {
      method: "POST",
      headers,
      body: JSON.stringify({
        parameters,
      }),
    });

    if (response.status >= 200 && response.status < 300) {
      return (await response.json()) as EndRequestLog;
    } else {
      throw response;
    }
  }
}
