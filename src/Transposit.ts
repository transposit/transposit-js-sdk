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
import { Stash } from ".";

export interface ClientClaims {
  iss: string; // issuer
  sub: string; // subject
  exp: number; // expiration
  iat: number; // issuedAt
  publicToken: string;
  repository: string;
  email: string;
  name: string;
}

export interface OperationParameters {
  [paramName: string]: string;
}

// https://my-app.transposit.io?clientJwt=...needKeys=... -> https://my-app.transposit.io
function hereWithoutSearch(): string {
  return `${window.location.origin}${window.location.pathname}`;
}

export const LOCAL_STORAGE_KEY = "TRANSPOSIT_SESSION";

export class Transposit {
  private claims: ClientClaims | null = null;

  constructor(private hostedAppOrigin: string = "") {
    this.claims = this.loadClaims();
  }

  private uri(path: string = ""): string {
    return `${this.hostedAppOrigin}${path}`;
  }

  private loadClaims(): ClientClaims | null {
    const claimsJSON = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!claimsJSON) {
      return null;
    }

    let claims: ClientClaims;
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

  private checkClaimsValid(claims: ClientClaims): boolean {
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

  handleLogin(callback?: (info: { needsKeys: boolean }) => void): void {
    // Read query parameters

    const searchParams = new URLSearchParams(window.location.search);

    if (!searchParams.has("clientJwt")) {
      throw new Error(
        "clientJwt query parameter could not be found. This method should only be called after redirection during login.",
      );
    }
    const clientJwtString = searchParams.get("clientJwt")!;

    if (!searchParams.has("needsKeys")) {
      throw new Error(
        "needsKeys query parameter could not be found. This is unexpected.",
      );
    }
    const needsKeys = searchParams.get("needsKeys")! === "true";

    // Parse JWT string

    const jwtParts: string[] = clientJwtString.split(".");
    if (jwtParts.length !== 3) {
      throw new Error(
        "clientJwt query parameter does not appear to be a valid JWT string. This method should only be called after redirection during login.",
      );
    }
    let claimsJSON: string;
    try {
      claimsJSON = atob(jwtParts[1]);
    } catch (err) {
      throw new Error(
        "clientJwt query parameter does not appear to be a valid JWT string. This method should only be called after redirection during login.",
      );
    }
    let claims: ClientClaims;
    try {
      claims = JSON.parse(claimsJSON);
    } catch (err) {
      throw new Error(
        "clientJwt query parameter does not appear to be a valid JWT string. This method should only be called after redirection during login.",
      );
    }
    if (!this.checkClaimsValid(claims)) {
      throw new Error(
        "clientJwt query parameter does not appear to be a valid JWT string. clientJwt is expired.",
      );
    }

    // Persist claims. Login has succeeded.

    this.claims = claims;
    this.persistClaims(claimsJSON);

    // Perform callback or default path replacement

    if (callback) {
      if (typeof callback !== "function") {
        throw new Error("Provided callback is not a function.");
      }
      callback({ needsKeys });
    } else {
      if (needsKeys) {
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

  get stash() {
    return new Stash(this);
  }

  async runOperation(
    operationId: string,
    params: OperationParameters = {},
  ): Promise<EndRequestLog> {
    return this.makeCallJson<EndRequestLog>(
      "POST",
      `/api/v1/execute/${operationId}`,
      {},
      { parameters: params },
    );
  }

  async makeCallJson<T>(
    method: string,
    path: string,
    queryParams: any,
    params?: any,
  ): Promise<T> {
    const response = await this.makeCall(method, path, queryParams, params);
    return await response.json();
  }

  async makeCall(
    method: string,
    path: string,
    queryParams: any,
    params?: any,
  ): Promise<Response> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (this.claims) {
      headers["X-PUBLIC-TOKEN"] = this.claims.publicToken;
    }

    const url = new URL(path, this.hostedAppOrigin);
    Object.keys(queryParams).forEach(key =>
      url.searchParams.append(key, queryParams[key]),
    );

    const body = params == null ? null : JSON.stringify(params);

    const response = await fetch(url.href, {
      credentials: "include",
      method: method,
      headers,
      body: body,
    });

    if (response.status >= 200 && response.status < 300) {
      return response;
    } else {
      throw response;
    }
  }
}
