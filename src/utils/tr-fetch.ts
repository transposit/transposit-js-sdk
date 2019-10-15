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

import { APIError } from "../errors/APIError";

/**
 * trfetch() is a thin-wrapper around native fetch().
 * It treats non-2XX responses as failures.
 * It assumes response bodies should be parsed as JSON.
 */
export async function trfetch(
  input: RequestInfo,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetch(input, init);
  if (response.ok) {
    return response;
  } else {
    let error;
    try {
      const body = await response.json();
      if (typeof body.message === "string") {
        error = new APIError(body.message, response);
      } else {
        error = makeInternalError(response);
      }
    } catch (e) {
      error = makeInternalError(response);
    }
    throw error;
  }
}

// @VisibleForTesting
export const INTERNAL_ERROR_MESSAGE: string =
  "API call failed in an unexpected way. Try again.";

function makeInternalError(response: Response): APIError {
  return new APIError(INTERNAL_ERROR_MESSAGE, response);
}
