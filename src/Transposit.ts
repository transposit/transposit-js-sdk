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

import {
  Environment,
  OperationError,
  OperationResponse,
  Stash,
  UserSetting,
} from ".";
import { EndRequestLog } from "./EndRequestLog";
import { APIError } from "./errors/APIError";
import { SDKError } from "./errors/SDKError";
import { popCodeVerifier, pushCodeVerifier } from "./signin/pkce-helper";
import {
  clearPersistedData,
  loadAccessToken,
  persistAccessToken,
  TokenResponse,
} from "./signin/token";
import { User } from "./signin/user";
import { chompSlash, formUrlEncode, hereWithoutSearch } from "./utils";
import { trfetch } from "./utils/tr-fetch";

export class Transposit {
  private hostedAppOrigin: string;
  private accessToken: string | null;

  constructor(hostedAppOrigin: string = "") {
    this.hostedAppOrigin = chompSlash(hostedAppOrigin);
    this.accessToken = null;

    this.load();
  }

  private uri(path: string = ""): string {
    return `${this.hostedAppOrigin}${path}`;
  }

  private load(): void {
    this.accessToken = loadAccessToken();
  }

  private assertIsSignedIn(): void {
    if (!this.accessToken) {
      throw new SDKError(
        "This method can only be called if the user is signed in",
      );
    }
  }

  isSignedIn(): boolean {
    return this.accessToken !== null;
  }

  async signIn(
    redirectUri: string,
    provider?: "google" | "slack",
  ): Promise<void> {
    const codeChallenge = await pushCodeVerifier();

    const params = new URLSearchParams();
    params.append("scope", "openid app");
    params.append("response_type", "code");
    params.append("client_id", "sdk");
    params.append("redirect_uri", redirectUri);
    params.append("prompt", "login");
    params.append("code_challenge", codeChallenge);
    params.append("code_challenge_method", "S256");
    if (provider) {
      params.append("provider", provider);
    }
    window.location.href = this.uri(`/login/authorize?${params.toString()}`);
  }

  async handleSignIn(): Promise<SignInSuccess> {
    // Read query parameters

    const searchParams = new URLSearchParams(window.location.search);

    if (!searchParams.has("code")) {
      throw new SDKError(
        "code query parameter could not be found. This method should only be called after redirection during sign-in.",
      );
    }
    const code = searchParams.get("code")!;

    // Exchange code for access_token

    const codeVerifier = popCodeVerifier();

    const headers = { "Content-Type": "application/x-www-form-urlencoded" };
    const body = {
      grant_type: "authorization_code",
      code,
      redirect_uri: hereWithoutSearch(),
      code_verifier: codeVerifier,
    };
    const tokenResponse = await this.makeCallJson<TokenResponse>(
      "POST",
      "/login/authorize/token",
      { headers, body },
    );

    // Perform sign-in

    persistAccessToken(tokenResponse.access_token);
    this.accessToken = tokenResponse.access_token;

    // Return to indicate sign-in success

    return { needsKeys: tokenResponse.needs_keys };
  }

  signOut(redirectUri: string): void {
    this.accessToken = null;
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

  get stash() {
    return new Stash(this);
  }

  get env() {
    return new Environment(this);
  }

  get userSetting() {
    return new UserSetting(this);
  }

  async loadUser(): Promise<User> {
    this.assertIsSignedIn();

    return await this.makeCallJson<User>("GET", "/api/v1/user");
  }

  async run<T>(
    operationId: string,
    parameters: OperationParameters = {},
  ): Promise<OperationResponse<T>> {
    const response = await this.makeCall(
      "POST",
      `/api/v1/execute/${operationId}`,
      { body: { parameters } },
    );
    const log = await extractJson<EndRequestLog>(response);
    if (log.status !== "SUCCESS") {
      throw new OperationError(log, response);
    }
    return new EndRequestLogResponse<T>(log, response);
  }

  async makeCallJson<T>(
    method: string,
    path: string,
    httpParams: HttpParams = {},
  ): Promise<T> {
    const response = await this.makeCall(method, path, httpParams);
    return extractJson<T>(response);
  }

  async makeCall(
    method: string,
    path: string,
    { queryParams, body, headers }: HttpParams = {},
  ): Promise<Response> {
    if (!headers) {
      headers = {
        "Content-Type": "application/json",
      };
      if (this.accessToken) {
        headers.Authorization = `Bearer ${this.accessToken}`;
      }
    }

    const url = new URL(path, this.hostedAppOrigin);
    if (queryParams != null) {
      Object.keys(queryParams).forEach(key =>
        url.searchParams.append(key, queryParams[key]),
      );
    }

    let bodyEncoder;
    if (headers["Content-Type"] === "application/x-www-form-urlencoded") {
      bodyEncoder = formUrlEncode;
    } else {
      bodyEncoder = JSON.stringify;
    }

    const response = await trfetch(
      url.href,
      Object.assign(
        { method, headers },
        body === null ? null : { body: bodyEncoder(body) }, // Only include body if non-null
      ),
    );

    return response;
  }
}

function extractJson<T>(response: Response): Promise<T> {
  return response.json().then(
    x => x,
    () => {
      throw new APIError("Failed to read response body", response);
    },
  );
}

interface HttpParams {
  body?: any;
  headers?: { [s: string]: string };
  queryParams?: { [s: string]: string };
}

export interface SignInSuccess {
  needsKeys: boolean;
}

export interface OperationParameters {
  [paramName: string]: string;
}

class EndRequestLogResponse<T> implements OperationResponse<T> {
  results: T[];
  requestId: string;
  constructor(log: EndRequestLog, response: Response) {
    this.requestId = log.requestId;
    const logResults = log.result.results;
    if (!logResults) {
      throw new APIError(
        "API returned an unexpected response schema",
        response,
      );
    }
    this.results = logResults;
  }

  get value(): T {
    if (this.results.length === 0) {
      throw new Error("Operation did not return a value");
    }
    return this.results[0];
  }
}
