/**
 * Copyright 2019 Transposit Corporation. All Rights Reserved.
 */
// todo all files need the more extensive copyright

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

// todo does this need to match up with the connect page?
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
  if (maybeUser) {
    try {
      // todo some form of validation here
      return JSON.parse(maybeUser) as User;
    } catch (e) {
      // noop
    }
  }
  return null;
}

export function clearPersistedData() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
