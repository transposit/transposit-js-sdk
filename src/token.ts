/*
 * Copyright 2019 Transposit Corporation. All Rights Reserved.
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

export interface TokenResponse {
  access_token: string;
  needs_keys: boolean;
  user: User;
}

export interface Claims {
  iss: string; // issuer
  sub: string; // subject
  exp: number; // expiration
  iat: number; // issuedAt
}

export interface User {
  name: string;
  email: string;
}

// Ensure no conflict with settings page session
const ACCESS_TOKEN_KEY = "TRANSPOSIT_ACCESS_TOKEN";
const USER_KEY = "TRANSPOSIT_USER";

function extractClaims(accessToken: string): Claims {
  return JSON.parse(atob(accessToken.split(".")[1]));
}

function areClaimsValid(claims: Claims) {
  const expiration = claims.exp * 1000;
  const now = Date.now();
  return expiration > now;
}

function isAccessTokenValid(accessToken: string): boolean {
  let claims: Claims | null = null;
  try {
    claims = extractClaims(accessToken);
  } catch (e) {
    return false;
  }
  return areClaimsValid(claims);
}

export function persistAccessToken(accessToken: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
}

export function loadAccessToken(): string | null {
  const maybeAccessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (maybeAccessToken && isAccessTokenValid(maybeAccessToken)) {
    return maybeAccessToken;
  }
  return null;
}

export function persistUser(user: User) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function loadUser(): User | null {
  const maybeUser = localStorage.getItem(USER_KEY);
  if (!maybeUser) {
    return null;
  }

  let possiblyUser: any;
  try {
    possiblyUser = JSON.parse(maybeUser);
  } catch (e) {
    return null;
  }

  if (
    typeof possiblyUser.name === "string" &&
    typeof possiblyUser.email === "string"
  ) {
    return possiblyUser as User;
  } else {
    return null;
  }
}

export function clearPersistedData() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
