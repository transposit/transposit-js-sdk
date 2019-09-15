/**
 * Copyright 2019 Transposit Corporation. All Rights Reserved.
 *
 * This code inspired by: https://developer.okta.com/blog/2019/05/01/is-the-oauth-implicit-flow-dead
 */

const PKCE_KEY = "TRANPOSIT_PKCE";

// Generate a secure random string using the browser crypto functions
function generateRandomString() {
  const array = new Uint32Array(28);
  window.crypto.getRandomValues(array);
  return Array.from(array, dec => ("0" + dec.toString(16)).substr(-2)).join("");
}

// Calculate the SHA256 hash of the input text.
// Returns a promise that resolves to an ArrayBuffer
function sha256(plain: string): PromiseLike<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest("SHA-256", data);
}

// Base64-urlencodes the input string
function base64urlencode(data: ArrayBuffer) {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(data)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Return the base64-urlencoded sha256 hash for the PKCE challenge
async function pkceChallengeFromVerifier(codeVerifier: string) {
  const hashed = await sha256(codeVerifier);
  return base64urlencode(hashed);
}

export async function pushCodeVerifier(): Promise<string> {
  // Create and store a new PKCE code_verifier (the plaintext random secret)
  const codeVerifier: string = generateRandomString();
  localStorage.setItem(PKCE_KEY, codeVerifier);

  // Hash and base64-urlencode the secret to use as the challenge
  return await pkceChallengeFromVerifier(codeVerifier);
}

export function popCodeVerifier(): string {
  const maybeCodeVerifier: string | null = localStorage.getItem(PKCE_KEY);
  if (!maybeCodeVerifier) {
    throw new Error("PKCE state could not be found.");
  }
  localStorage.removeItem(PKCE_KEY);
  return maybeCodeVerifier;
}
