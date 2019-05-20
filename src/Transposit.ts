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

// From https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
function getParameterByName(name: string): string | null {
  const url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)");
  const results = regex.exec(url);
  if (!results) {
    return null;
  }
  if (!results[2]) {
    return "";
  }
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

export const TRANSPOSIT_CONSUME_KEY_PREFIX = "TRANSPOSIT_CONSUME_KEY";

export class Transposit {
  constructor(
    private serviceMaintainer: string,
    private serviceName: string,
    private tpsHostedAppApiUrl: string = "https://console.transposit.com",
  ) {}

  private getConsumeKey(): string {
    return `${TRANSPOSIT_CONSUME_KEY_PREFIX}/${this.serviceMaintainer}/${
      this.serviceName
    }`;
  }

  private retrieveClientClaims(): ClientClaims | null {
    const clientClaimJSON = localStorage.getItem(this.getConsumeKey());
    if (!clientClaimJSON) {
      return null;
    }

    return JSON.parse(clientClaimJSON);
  }

  private areClientClaimsValid(clientClaims: ClientClaims): boolean {
    const expiration = clientClaims.exp * 1000;
    const now = Date.now();
    return expiration > now;
  }

  private persistClientClaims(clientClaimsJSON: string): void {
    localStorage.setItem(this.getConsumeKey(), clientClaimsJSON);
  }

  private clearClientClaims(): void {
    localStorage.removeItem(this.getConsumeKey());
  }

  private apiUrl(relativePath: string = ""): string {
    return `${this.tpsHostedAppApiUrl}/app/${this.serviceMaintainer}/${
      this.serviceName
    }${relativePath}`;
  }

  handleLogin(callback?: (info: { needsKeys: boolean }) => void): void {
    // Read query parameters

    const maybeClientJwtString = getParameterByName("clientJwt");
    if (maybeClientJwtString === null) {
      throw new Error(
        "clientJwt query parameter could not be found. This method should only be called after redirection during login.",
      );
    }
    const clientJwtString = maybeClientJwtString;

    const maybeNeedsKeys = getParameterByName("needsKeys");
    if (maybeNeedsKeys === null) {
      throw new Error(
        "needsKeys query parameter could not be found. This is unexpected.",
      );
    }
    const needsKeys = maybeNeedsKeys === "true";

    // Parse JWT string and persist claims

    const jwtParts: string[] = clientJwtString.split(".");
    if (jwtParts.length !== 3) {
      throw new Error(
        "clientJwt query parameter does not appear to be a valid JWT string. This method should only be called after redirection during login.",
      );
    }
    let clientClaimsJSON: string;
    try {
      clientClaimsJSON = atob(jwtParts[1]);
    } catch (err) {
      throw new Error(
        "clientJwt query parameter does not appear to be a valid JWT string. This method should only be called after redirection during login.",
      );
    }
    try {
      JSON.parse(clientClaimsJSON); // validate JSON
    } catch (err) {
      throw new Error(
        "clientJwt query parameter does not appear to be a valid JWT string. This method should only be called after redirection during login.",
      );
    }

    this.persistClientClaims(clientClaimsJSON);

    // Login has succeeded, either callback or default path replacement

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

  async logOut(): Promise<void> {
    const clientClaims = this.retrieveClientClaims();
    if (!clientClaims) {
      // Already logged out, nothing to do
      return;
    }

    // Attempt to invalidate session with Transposit
    try {
      await fetch(this.apiUrl(`/api/v1/logout`), {
        credentials: "include",
        method: "POST",
        headers: {
          "content-type": "application/json",
          "X-PUBLIC-TOKEN": clientClaims.publicToken,
        },
      });
    } catch (err) {
      // Logout is a best effort, do nothing if there is an error remotely
    }

    // Delete JWT from local storage
    this.clearClientClaims();
  }

  getConnectLocation(requestUri?: string): string {
    return this.apiUrl(
      "/connect?redirectUri=" +
        encodeURIComponent(requestUri || window.location.href),
    );
  }

  // Deprecated in favor of startLoginUri
  getGoogleLoginLocation(redirectUri?: string): string {
    return this.startLoginUri(redirectUri);
  }

  startLoginUri(redirectUri?: string): string {
    return this.apiUrl(
      "/login/accounts?redirectUri=" +
        encodeURIComponent(redirectUri || window.location.href),
    );
  }

  getLoginLocation(): string {
    return this.apiUrl("/login");
  }

  getUserEmail(): string | null {
    const clientClaims = this.retrieveClientClaims();
    if (!clientClaims) {
      return null;
    }

    return clientClaims.email;
  }

  getUserName(): string | null {
    const clientClaims = this.retrieveClientClaims();
    if (!clientClaims) {
      return null;
    }

    return clientClaims.name;
  }

  isLoggedIn(): boolean {
    const clientClaims = this.retrieveClientClaims();
    return clientClaims !== null && this.areClientClaimsValid(clientClaims);
  }

  async runOperation(
    operationId: string,
    params: OperationParameters = {},
  ): Promise<EndRequestLog> {
    const headerInfo = {
      "content-type": "application/json",
    } as any;

    const clientClaims = this.retrieveClientClaims();
    if (clientClaims) {
      headerInfo["X-PUBLIC-TOKEN"] = clientClaims.publicToken;
    }

    // Note from MDN: The Promise returned from fetch() won’t reject on HTTP error status even
    // if the response is an HTTP 404 or 500. Instead, it will resolve normally (with ok status
    // set to false), and it will only reject on network failure or if anything prevented the request from completing.
    try {
      const response = await fetch(
        this.apiUrl(`/api/v1/execute/${operationId}`),
        {
          credentials: "include",
          method: "POST",
          headers: headerInfo,
          body: JSON.stringify({
            parameters: params,
          }),
        },
      );
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
