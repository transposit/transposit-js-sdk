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

export interface Token {
  access_token: string;
  needs_keys: boolean;
  user: { name: string; email: string };
}

export interface Claims {
  iss: string; // issuer
  sub: string; // subject
  exp: number; // expiration
  iat: number; // issuedAt
}

export interface OperationParameters {
  [paramName: string]: string;
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

function extractClaims(bearerToken: string): Claims {
  return JSON.parse(atob(bearerToken.split(".")[1]));
}

function isBearerTokenValid(claims: Claims): boolean {
  const expiration = claims.exp * 1000;
  const now = Date.now();
  return expiration > now;
}

export const LOCAL_STORAGE_KEY = "TRANSPOSIT_SESSION";
export const PKCE_KEY = "TRANPOSIT_PKCE";

export class Transposit {
  private claims: Claims | null = null;

  constructor(private hostedAppOrigin: string = "") {
    this.claims = this.loadClaims();
  }

  private uri(path: string = ""): string {
    return `${this.hostedAppOrigin}${path}`;
  }

  private loadClaims(): Claims | null {
    const claimsJSON = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!claimsJSON) {
      return null;
    }

    let claims: Claims;
    try {
      claims = JSON.parse(claimsJSON);
    } catch (err) {
      return null;
    }

    if (!this.checkClaimsValid(claims)) {
      return null;
    }

    return claims;
  }

  private persistClaims(claimsJSON: string): void {
    localStorage.setItem(LOCAL_STORAGE_KEY, claimsJSON);
  }

  private clearClaims(): void {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }

  private checkClaimsValid(claims: Claims): boolean {
    const expiration = claims.exp * 1000;
    const now = Date.now();
    return expiration > now;
  }

  private assertLoggedIn(): void {
    if (this.claims === null) {
      throw new Error("No client claims found.");
    }
  }

  isLoggedIn(): boolean {
    return this.claims !== null;
  }

  // todo how should this callback work?
  async handleLogin(
    callback?: (info: { needsKeys: boolean }) => void,
  ): Promise<void> {
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

    const codeVerifier = localStorage.getItem(PKCE_KEY);
    if (codeVerifier === null) {
      throw new Error("PKCE state could not be found.");
    }

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

    const token = (await response.json()) as Token;

    const claims: Claims = extractClaims(token.access_token);
    if (!isBearerTokenValid(claims)) {
      throw new Error("access_token is expired.");
    }

    // Persist claims. Login has succeeded.

    this.claims = claims;
    localStorage.setItem(LOCAL_STORAGE_KEY, token.access_token);
    localStorage.setItem(LOCAL_STORAGE_KEY, token.access_token);

    // Perform callback or default path replacement

    if (callback) {
      if (typeof callback !== "function") {
        throw new Error("Provided callback is not a function.");
      }
      callback({ needsKeys: token.needs_keys });
    } else {
      if (token.needs_keys) {
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

  logOut(redirectUri: string): void {
    this.clearClaims();
    this.claims = null;

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

  startLoginUri(redirectUri?: string, provider?: "google" | "slack"): string {
    const params = new URLSearchParams();
    params.append("redirectUri", redirectUri || window.location.href);
    if (provider) {
      params.append("provider", provider);
    }
    return this.uri(`/login/accounts?${params.toString()}`);
  }

  // Deprecated in favor of settingsUri
  getConnectLocation(redirectUri?: string): string {
    return this.settingsUri(redirectUri);
  }

  // Deprecated in favor of startLoginUri
  getGoogleLoginLocation(redirectUri?: string): string {
    return this.startLoginUri(redirectUri, "google");
  }

  // Deprecated
  getLoginLocation(): string {
    return this.uri("/login");
  }

  getUserEmail(): string | null {
    this.assertLoggedIn();
    return this.claims!.email;
  }

  getUserName(): string | null {
    this.assertLoggedIn();
    return this.claims!.name;
  }

  async runOperation(
    operationId: string,
    params: OperationParameters = {},
  ): Promise<EndRequestLog> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (this.claims) {
      headers["X-PUBLIC-TOKEN"] = this.claims.publicToken;
    }

    const response = await fetch(this.uri(`/api/v1/execute/${operationId}`), {
      credentials: "include",
      method: "POST",
      headers,
      body: JSON.stringify({
        parameters: params,
      }),
    });

    if (response.status >= 200 && response.status < 300) {
      return (await response.json()) as EndRequestLog;
    } else {
      throw response;
    }
  }
}
