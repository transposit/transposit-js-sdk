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

export const TRANSPOSIT_CONSUME_KEY = "TRANSPOSIT_CONSUME_KEY";

export class Transposit {
  private claims: ClientClaims | null = null;

  // todo backwards compatibility with old key?
  constructor(private baseUri: string = "") {
    this.claims = this.loadClaims();
  }

  private uri(relativePath: string = ""): string {
    return `${this.baseUri}${relativePath}`;
  }

  private loadClaims(): ClientClaims | null {
    const claimsJSON = localStorage.getItem(TRANSPOSIT_CONSUME_KEY);
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
    localStorage.setItem(TRANSPOSIT_CONSUME_KEY, claimsJSON);
  }

  private clearClaims(): void {
    localStorage.removeItem(TRANSPOSIT_CONSUME_KEY);
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
        const hereWithoutQueryParameters: string = `${
          window.location.protocol
        }//${window.location.host}${window.location.pathname}`;
        window.location.href = this.getConnectLocation(
          hereWithoutQueryParameters,
        );
      } else {
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );
      }
    }
  }

  // todo fix logout
  async logOut(): Promise<void> {
    if (!this.claims) {
      // Already logged out, nothing to do
      return;
    }

    // Attempt to invalidate session with Transposit
    try {
      await fetch(this.uri(`/api/v1/logout`), {
        credentials: "include",
        method: "POST",
        headers: {
          "content-type": "application/json",
          "X-PUBLIC-TOKEN": this.claims.publicToken,
        },
      });
    } catch (err) {
      // Logout is a best effort, do nothing if there is an error remotely
    }

    // Remove claims. Logout has succeeded.
    this.clearClaims();
    this.claims = null;
  }

  settingsUri(requestUri?: string): string {
    return this.uri(
      "/settings?redirectUri=" +
        encodeURIComponent(requestUri || window.location.href),
    );
  }

  startLoginUri(redirectUri?: string): string {
    return this.uri(
      "/login/accounts?redirectUri=" +
        encodeURIComponent(redirectUri || window.location.href),
    );
  }

  loginUri(): string {
    return this.uri("/login");
  }

  // Deprecated in favor of settingsUri
  getConnectLocation(requestUri?: string): string {
    return this.settingsUri(requestUri);
  }

  // Deprecated in favor of startLoginUri
  getGoogleLoginLocation(redirectUri?: string): string {
    return this.startLoginUri(redirectUri);
  }

  // Deprecated in favor of loginUri
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
    const headerInfo = {
      "content-type": "application/json",
    } as any;

    if (this.claims) {
      headerInfo["X-PUBLIC-TOKEN"] = this.claims.publicToken;
    }

    // Note from MDN: The Promise returned from fetch() won’t reject on HTTP error status even
    // if the response is an HTTP 404 or 500. Instead, it will resolve normally (with ok status
    // set to false), and it will only reject on network failure or if anything prevented the request from completing.
    try {
      const response = await fetch(this.uri(`/api/v1/execute/${operationId}`), {
        credentials: "include",
        method: "POST",
        headers: headerInfo,
        body: JSON.stringify({
          parameters: params,
        }),
      });
      if (response.status >= 200 && response.status < 300) {
        return (await response.json()) as EndRequestLog;
      } else {
        throw response;
      }
    } catch (e) {
      throw e;
    }
  }
}
