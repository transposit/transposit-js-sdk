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
// This code inspired by: https://developer.okta.com/blog/2019/05/01/is-the-oauth-implicit-flow-dead

import { SDKError } from "../errors/SDKError";

const PKCE_KEY = "TRANPOSIT_PKCE";

function generateRandomString(): string {
  const array = new Uint32Array(28);
  window.crypto.getRandomValues(array);
  return Array.from(array, dec => ("0" + dec.toString(16)).substr(-2)).join("");
}

function sha256(plain: string): PromiseLike<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest("SHA-256", data);
}

function base64urlencode(data: ArrayBuffer): string {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(data)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function pkceChallengeFromVerifier(codeVerifier: string) {
  const hashed = await sha256(codeVerifier);
  return base64urlencode(hashed);
}

export async function pushCodeVerifier(): Promise<string> {
  const codeVerifier: string = generateRandomString();
  localStorage.setItem(PKCE_KEY, codeVerifier);
  return await pkceChallengeFromVerifier(codeVerifier);
}

export function popCodeVerifier(): string {
  const maybeCodeVerifier: string | null = localStorage.getItem(PKCE_KEY);
  if (!maybeCodeVerifier) {
    throw new SDKError("PKCE state could not be found.");
  }
  localStorage.removeItem(PKCE_KEY);
  return maybeCodeVerifier;
}
