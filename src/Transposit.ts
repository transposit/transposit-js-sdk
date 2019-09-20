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
import { popCodeVerifier, pushCodeVerifier } from "./signin/pkce-helper";
import {
  clearPersistedData,
  loadAccessToken,
  persistAccessToken,
  TokenResponse,
  User,
} from "./signin/token";
import { chompSlash, formUrlEncode, hereWithoutSearch } from "./utils";

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

  private assertSignedIn(): void {
    if (this.accessToken === null) {
      throw new Error("Missing accessToken or user. No one is signed in.");
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
      throw new Error(
        "code query parameter could not be found. This method should only be called after redirection during sign-in.",
      );
    }
    const code = searchParams.get("code")!;

    // Exchange code for access_token

    const codeVerifier = popCodeVerifier();

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
    if (!response.ok) {
      throw Error(response.statusText);
    }
    const tokenResponse = (await response.json()) as TokenResponse;

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

  getUser(): User {
    this.assertSignedIn();
    throw Error("NYI");
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

export interface SignInSuccess {
  needsKeys: boolean;
}

export interface OperationParameters {
  [paramName: string]: string;
}
