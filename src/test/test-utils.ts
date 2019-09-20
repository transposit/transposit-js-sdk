import { Claims } from "../signin/token";

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

export const NOW_MINUS_3_DAYS: number = 1521996119000;
export const NOW: number = 1522255319000;
export const NOW_PLUS_3_DAYS: number = 1522514519000;

export function setHref(
  origin: string,
  pathname: string,
  search: string,
): void {
  window.location.href = `${origin}${pathname}${search}`;
  (window.location as any).origin = origin; // origin is normally read-only, but not in tests :)
  window.location.pathname = pathname;
  window.location.search = search;
}

export function createUnsignedJwt(claims: Claims): string {
  const header: string = btoa(JSON.stringify({ alg: "none" }));
  const body: string = btoa(JSON.stringify(claims));
  return `${header}.${body}.`;
}
